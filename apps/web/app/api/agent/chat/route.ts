import { AGENT_SYSTEM_PROMPT } from "@/lib/agent-system-prompt";
import { AgentChatRequestSchema } from "@/lib/schemas";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// TODO(phase-0): Turnstile verification on the first message of a session.
// TODO(phase-0): Rate limiting — per IP hash + per sessionId, backed by D1 / KV.
// TODO(phase-0): MONTHLY_TOKEN_CAP enforcement + short-break fallback reply.
// TODO(phase-0): Log turn metadata (session id, latency, token counts, actions)
//                to D1 `agent_sessions` / `agent_turns`.

const DEFAULT_MODEL = "gemini-flash-lite-latest";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
}

interface GeminiStreamFrame {
  candidates?: GeminiCandidate[];
}

function encodeSseFrame(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function encodeSseDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}

function extractDeltaFromFrame(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as GeminiStreamFrame;
    const parts = parsed.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join("");
    return text || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = AgentChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { messages } = parsed.data;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Gemini REST does not accept role:"system" in `contents` — we pass the
  // system prompt via `systemInstruction` and strip any system messages the
  // client may have forwarded.
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const geminiBody = {
    systemInstruction: { parts: [{ text: AGENT_SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  };

  const upstreamUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent` +
    `?alt=sse&key=${apiKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });
  } catch (err) {
    const errorStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encodeSseFrame({
            error: `upstream_fetch_failed: ${(err as Error).message}`,
          }),
        );
        controller.enqueue(encodeSseDone());
        controller.close();
      },
    });
    return new Response(errorStream, { headers: SSE_HEADERS });
  }

  if (!upstream.ok || !upstream.body) {
    let hint = `upstream_${upstream.status}`;
    try {
      const text = await upstream.text();
      // Keep error messages small — don't leak the full Gemini error body.
      hint = `${hint}: ${text.slice(0, 200)}`;
    } catch {
      // ignore
    }
    const errorStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encodeSseFrame({ error: hint }));
        controller.enqueue(encodeSseDone());
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: SSE_HEADERS,
      // Keep 200 so EventSource clients happily consume the error frame.
      status: 200,
    });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          // Flush any trailing buffered frame.
          if (buffer.trim()) {
            const pending = buffer;
            buffer = "";
            for (const line of pending.split(/\r?\n/)) {
              if (!line.startsWith("data:")) continue;
              const delta = extractDeltaFromFrame(line.slice(5));
              if (delta) controller.enqueue(encodeSseFrame({ delta }));
            }
          }
          controller.enqueue(encodeSseDone());
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        // Gemini SSE separates frames by blank lines. Split on blank-line
        // boundaries and keep the (possibly incomplete) tail for next pull.
        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          for (const line of chunk.split(/\r?\n/)) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5);
            const delta = extractDeltaFromFrame(payload);
            if (delta) controller.enqueue(encodeSseFrame({ delta }));
          }
        }
      } catch (err) {
        controller.enqueue(
          encodeSseFrame({ error: `stream_error: ${(err as Error).message}` }),
        );
        controller.enqueue(encodeSseDone());
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => undefined);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
