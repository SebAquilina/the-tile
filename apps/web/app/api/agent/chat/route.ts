import { AGENT_SYSTEM_PROMPT } from "@/lib/agent-system-prompt";
import { getAgentSettings } from "@/lib/agent-config/store";
import { AgentChatRequestSchema } from "@/lib/schemas";
import { hashIp, clientIp } from "@/lib/ip-hash";
import { limitAgentPerIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "gemini-flash-lite-latest";
const SESSION_COOKIE = "tt_agent_session";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h — matches spec's return-visit window.

const SSE_HEADERS: Record<string, string> = {
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

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GeminiStreamFrame {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
}

// --- Module-scope monthly token counter (approximate, per isolate) -----------
// Each edge isolate keeps its own counter, reset on the first request of a new
// calendar month (UTC). A durable counter backed by D1 / KV is Phase 2. For
// Phase 1 this is a best-effort circuit breaker against runaway bills.

let tokenBucketMonth = monthKey(new Date());
let monthlyTokens = 0;

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function resetIfNewMonth(): void {
  const current = monthKey(new Date());
  if (current !== tokenBucketMonth) {
    tokenBucketMonth = current;
    monthlyTokens = 0;
  }
}

function isTokenCapExceeded(): boolean {
  resetIfNewMonth();
  const raw = process.env.MONTHLY_TOKEN_CAP;
  if (!raw) return false;
  const cap = Number(raw);
  if (!Number.isFinite(cap) || cap <= 0) return false;
  return monthlyTokens >= cap;
}

function recordTokens(used: number): void {
  if (!Number.isFinite(used) || used <= 0) return;
  resetIfNewMonth();
  monthlyTokens += used;
}

// --- SSE helpers -------------------------------------------------------------

function encodeSseFrame(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function encodeSseDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}

/**
 * Build a polite-fallback SSE stream with a single error frame. Used for
 * rate-limit, bot-check, and token-cap hits so the frontend can render a
 * friendly message without a network error.
 */
function politeFallback(
  error: "busy" | "bot-check" | "token-cap",
  message: string,
  extraHeaders: Record<string, string> = {},
): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encodeSseFrame({ error, message }));
      controller.enqueue(encodeSseDone());
      controller.close();
    },
  });
  return new Response(stream, {
    // Keep 200 so EventSource / fetch-stream clients consume the frame cleanly,
    // except for the true 429 case where we want observability in server logs.
    status: error === "busy" ? 429 : 200,
    headers: { ...SSE_HEADERS, ...extraHeaders },
  });
}

function extractDeltaFromFrame(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as GeminiStreamFrame;
    const parts = parsed.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join("");
    // Record token usage opportunistically — Gemini emits usageMetadata on the
    // final frame (and sometimes interstitially).
    const used = parsed.usageMetadata?.totalTokenCount;
    if (typeof used === "number") recordTokens(used);
    return text || null;
  } catch {
    return null;
  }
}

// --- Session cookie ---------------------------------------------------------

function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      const value = rest.join("=").trim();
      return value || null;
    }
  }
  return null;
}

function buildSessionCookie(value: string): string {
  return [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${SESSION_COOKIE_MAX_AGE}`,
  ].join("; ");
}

// --- Route ------------------------------------------------------------------

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

  const { messages, sessionId, isFirstMessage, turnstileToken } = parsed.data;

  // Plant / refresh the agent session cookie (HttpOnly; identity-free).
  const existingCookie = readSessionCookie(request);
  const cookieValue = existingCookie ?? sessionId;
  const setCookieHeader = buildSessionCookie(cookieValue);

  // --- Rate limit: 30/min + 200/hr per IP hash ---
  const ipHash = await hashIp(request);
  const limited = limitAgentPerIp(ipHash);
  if (!limited.ok) {
    return politeFallback(
      "busy",
      "We're taking a breather — please try again in a moment.",
      {
        "Set-Cookie": setCookieHeader,
        "Retry-After": String(
          Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000)),
        ),
      },
    );
  }

  // --- Turnstile gate on the first message of a session ---
  if (isFirstMessage === true) {
    const ok = await verifyTurnstile(turnstileToken, clientIp(request));
    if (!ok) {
      return politeFallback(
        "bot-check",
        "Please complete the quick human check and try again.",
        { "Set-Cookie": setCookieHeader },
      );
    }
  }

  // --- Monthly token cap (approximate, per-isolate) ---
  if (isTokenCapExceeded()) {
    return politeFallback(
      "token-cap",
      "I'm taking a short break — in the meantime, please browse the collections or drop us a note.",
      { "Set-Cookie": setCookieHeader },
    );
  }

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

  // Layer operator-edited persona on top of the baked catalogue prompt.
  // The base AGENT_SYSTEM_PROMPT contains product knowledge (Italian
  // collections, finishes, sizes, formats). The operator-edited row from D1
  // adds tone / rules / handoff so /admin/agent edits actually reach the
  // live agent (was a phantom — every save toast was a lie pre-2026-04-30).
  let systemPrompt = AGENT_SYSTEM_PROMPT;
  try {
    const a = await getAgentSettings();
    const rules = (a.rules_json ?? []).map((r) => `- ${r}`).filter(Boolean).join("\n");
    const handOff = [
      a.fallback_contact && `Fallback: ${a.fallback_contact}`,
      a.hand_off_phone && `Phone: ${a.hand_off_phone}`,
      a.hand_off_email && `Email: ${a.hand_off_email}`,
    ].filter(Boolean).join(" · ");
    const overrides: string[] = [];
    if (a.persona_name && a.persona_name !== "Concierge") {
      overrides.push(`# Operator persona override\nPersona: ${a.persona_name}`);
    }
    if (a.voice && a.voice.trim()) {
      overrides.push(`# Operator voice override\n${a.voice}`);
    }
    if (rules) overrides.push(`# Operator rules\n${rules}`);
    if (handOff) overrides.push(`# Hand-off contacts (operator-set)\n${handOff}`);
    if (a.custom_kb_md && a.custom_kb_md.trim()) {
      overrides.push(`# Operator custom knowledge\n${a.custom_kb_md}`);
    }
    if (overrides.length > 0) {
      systemPrompt = AGENT_SYSTEM_PROMPT + "\n\n---\n\n" + overrides.join("\n\n");
    }
  } catch (e) {
    console.warn("[agent.chat] getAgentSettings failed:", (e as Error).message);
  }

  const geminiBody = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
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
    return new Response(errorStream, {
      headers: { ...SSE_HEADERS, "Set-Cookie": setCookieHeader },
    });
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
      headers: { ...SSE_HEADERS, "Set-Cookie": setCookieHeader },
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

  // `sessionId` is intentionally referenced so TS treats the destructure as
  // fully-used even when session logic is kept cookie-only (the cookie value
  // defaults to the client-supplied id on first contact).
  void sessionId;

  return new Response(stream, {
    headers: { ...SSE_HEADERS, "Set-Cookie": setCookieHeader },
  });
}
