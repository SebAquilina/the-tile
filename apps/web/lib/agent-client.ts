/**
 * Client for the `/api/agent/chat` SSE endpoint.
 *
 * The server streams `data: {"delta":"..."}` frames terminated by
 * `data: [DONE]`. We accumulate the full text, then parse the action trailer:
 *
 *   canonical:    "reply\n\n---ACTIONS---\n[{...},{...}]"
 *   fallback:     "reply\n\nACTION: NAVIGATE /collections/marble"
 *
 * Malformed trailers are discarded silently (per `05-agent-spec.md §5`).
 * The visible text passed to `onDone` has the trailer stripped.
 */

import type { AgentAction } from "@/lib/events";
import type { AgentMessage } from "@/lib/schemas";

export interface SendChatMessageOptions {
  messages: AgentMessage[];
  sessionId: string;
  onDelta?: (delta: string) => void;
  onAction?: (action: AgentAction) => void;
  onError?: (error: string) => void;
  onDone?: (finalVisibleText: string) => void;
  signal?: AbortSignal;
}

const ACTIONS_MARKER = "---ACTIONS---";

// --- Public entry point ---

export async function sendChatMessage({
  messages,
  sessionId,
  onDelta,
  onAction,
  onError,
  onDone,
  signal,
}: SendChatMessageOptions): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, sessionId }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    onError?.(`network: ${(err as Error).message}`);
    return;
  }

  if (!response.ok || !response.body) {
    onError?.(`http_${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let rawText = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames separated by blank lines.
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const result = processFrame(frame);
        if (result.kind === "done") {
          finalise();
          return;
        }
        if (result.kind === "delta") {
          rawText += result.text;
          onDelta?.(result.text);
        } else if (result.kind === "error") {
          onError?.(result.message);
        }
      }
    }

    // Flush any trailing buffered frame.
    if (buffer.trim()) {
      const result = processFrame(buffer);
      if (result.kind === "delta") {
        rawText += result.text;
        onDelta?.(result.text);
      } else if (result.kind === "error") {
        onError?.(result.message);
      }
    }

    finalise();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    onError?.(`stream: ${(err as Error).message}`);
  }

  function finalise() {
    const { visibleText, actions } = parseActionTrailer(rawText);
    for (const action of actions) {
      onAction?.(action);
    }
    onDone?.(visibleText);
  }
}

// --- Frame parsing ---

type FrameResult =
  | { kind: "delta"; text: string }
  | { kind: "done" }
  | { kind: "error"; message: string }
  | { kind: "noop" };

function processFrame(frame: string): FrameResult {
  const lines = frame.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload) continue;
    if (payload === "[DONE]") return { kind: "done" };

    try {
      const parsed = JSON.parse(payload) as {
        delta?: string;
        error?: string;
      };
      if (typeof parsed.error === "string" && parsed.error.length > 0) {
        return { kind: "error", message: parsed.error };
      }
      if (typeof parsed.delta === "string" && parsed.delta.length > 0) {
        return { kind: "delta", text: parsed.delta };
      }
    } catch {
      // Ignore malformed SSE payload.
    }
  }
  return { kind: "noop" };
}

// --- Action trailer parsing ---

export interface ParsedReply {
  visibleText: string;
  actions: AgentAction[];
}

/**
 * Extract the action trailer from the raw assistant text. Handles both the
 * canonical `---ACTIONS---` JSON-array format and the drifted `ACTION: TYPE`
 * single-line fallback. Malformed JSON is discarded silently. The returned
 * `visibleText` is trimmed and has the trailer stripped.
 */
export function parseActionTrailer(raw: string): ParsedReply {
  const markerIndex = raw.indexOf(ACTIONS_MARKER);
  if (markerIndex !== -1) {
    const visibleText = raw.slice(0, markerIndex).trimEnd();
    const trailer = raw.slice(markerIndex + ACTIONS_MARKER.length).trim();
    const actions = parseCanonicalActions(trailer);
    return { visibleText, actions };
  }

  // Fallback: look for stray `ACTION: TYPE ...` lines. Strip matches from the
  // visible text and parse what we can.
  return parseFallbackActions(raw);
}

function parseCanonicalActions(trailer: string): AgentAction[] {
  // Agent may wrap the JSON in a code fence. Strip ```...``` wrappers.
  let cleaned = trailer.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    cleaned = cleaned.trim();
  }
  if (!cleaned) return [];

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    const actions: AgentAction[] = [];
    for (const entry of parsed) {
      const action = coerceAction(entry);
      if (action) actions.push(action);
    }
    return actions;
  } catch {
    return [];
  }
}

function coerceAction(raw: unknown): AgentAction | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { type?: unknown; data?: unknown };
  if (typeof r.type !== "string") return null;
  const data = (r.data && typeof r.data === "object" ? r.data : {}) as Record<
    string,
    unknown
  >;

  switch (r.type) {
    case "navigate":
      if (typeof data.url === "string") {
        return { type: "navigate", data: { url: data.url } };
      }
      return null;
    case "scroll":
      if (typeof data.selector === "string") {
        return { type: "scroll", data: { selector: data.selector } };
      }
      return null;
    case "filter": {
      const filterData: {
        effect?: string;
        usage?: string;
        brand?: string;
        tag?: string;
        q?: string;
      } = {};
      if (typeof data.effect === "string") filterData.effect = data.effect;
      if (typeof data.usage === "string") filterData.usage = data.usage;
      if (typeof data.brand === "string") filterData.brand = data.brand;
      if (typeof data.tag === "string") filterData.tag = data.tag;
      if (typeof data.q === "string") filterData.q = data.q;
      return { type: "filter", data: filterData };
    }
    case "highlight-products": {
      if (Array.isArray(data.ids)) {
        const ids = data.ids.filter((x): x is string => typeof x === "string");
        return { type: "highlight-products", data: { ids } };
      }
      return null;
    }
    case "add-to-save-list":
      if (typeof data.productId === "string") {
        return { type: "add-to-save-list", data: { productId: data.productId } };
      }
      return null;
    case "open-save-list":
      return { type: "open-save-list" };
    case "submit-lead": {
      if (typeof data.name !== "string" || typeof data.email !== "string") {
        return null;
      }
      return {
        type: "submit-lead",
        data: {
          name: data.name,
          email: data.email,
          phone: typeof data.phone === "string" ? data.phone : undefined,
          projectNotes:
            typeof data.projectNotes === "string" ? data.projectNotes : undefined,
          areaM2: typeof data.areaM2 === "number" ? data.areaM2 : undefined,
          saveIds: Array.isArray(data.saveIds)
            ? data.saveIds.filter((x): x is string => typeof x === "string")
            : undefined,
        },
      };
    }
    case "escalate": {
      const channel = data.channel;
      if (channel === "email" || channel === "whatsapp" || channel === "showroom") {
        return {
          type: "escalate",
          data: {
            channel,
            reason: typeof data.reason === "string" ? data.reason : undefined,
          },
        };
      }
      return null;
    }
    case "cite": {
      if (Array.isArray(data.productIds)) {
        const productIds = data.productIds.filter(
          (x): x is string => typeof x === "string",
        );
        return { type: "cite", data: { productIds } };
      }
      return null;
    }
    default:
      return null;
  }
}

// --- Fallback regex scanner for drifted `ACTION:` lines ---

const FALLBACK_LINE_RE =
  /^\s*ACTION:\s*(NAVIGATE|SCROLL|FILTER|HIGHLIGHT|HIGHLIGHT-PRODUCTS|ADD-TO-SAVE-LIST|OPEN-SAVE-LIST|ESCALATE|CITE)\s*(.*)$/i;

function parseFallbackActions(raw: string): ParsedReply {
  const lines = raw.split(/\r?\n/);
  const keptLines: string[] = [];
  const actions: AgentAction[] = [];

  for (const line of lines) {
    const match = line.match(FALLBACK_LINE_RE);
    if (!match) {
      keptLines.push(line);
      continue;
    }
    const type = match[1].toUpperCase();
    const rest = match[2].trim();
    const action = coerceFallback(type, rest);
    if (action) actions.push(action);
    // Always strip the matched line from visible text, even if we couldn't parse.
  }

  return {
    visibleText: keptLines.join("\n").trimEnd(),
    actions,
  };
}

function coerceFallback(type: string, rest: string): AgentAction | null {
  switch (type) {
    case "NAVIGATE": {
      const url = rest.split(/\s+/)[0];
      if (!url) return null;
      return { type: "navigate", data: { url } };
    }
    case "SCROLL": {
      const selector = rest.trim();
      if (!selector) return null;
      return { type: "scroll", data: { selector } };
    }
    case "FILTER": {
      const data: Record<string, string> = {};
      for (const pair of rest.split(/\s+/)) {
        const [k, v] = pair.split("=");
        if (k && v) data[k.trim()] = v.trim();
      }
      return { type: "filter", data };
    }
    case "HIGHLIGHT":
    case "HIGHLIGHT-PRODUCTS": {
      const ids = rest
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length === 0) return null;
      return { type: "highlight-products", data: { ids } };
    }
    case "ADD-TO-SAVE-LIST": {
      const productId = rest.trim();
      if (!productId) return null;
      return { type: "add-to-save-list", data: { productId } };
    }
    case "OPEN-SAVE-LIST":
      return { type: "open-save-list" };
    case "ESCALATE": {
      const channel = rest.trim().toLowerCase();
      if (channel === "email" || channel === "whatsapp" || channel === "showroom") {
        return { type: "escalate", data: { channel } };
      }
      return null;
    }
    case "CITE": {
      const productIds = rest
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { type: "cite", data: { productIds } };
    }
    default:
      return null;
  }
}
