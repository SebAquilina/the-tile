import { test, expect, type APIRequestContext } from "@playwright/test";
import battery from "../dialogue-battery.json";

interface BatteryTest {
  id: string;
  category: string;
  severity: string;
  prompt?: string;
  multiTurn?: { role: "user" | "assistant"; content: string }[];
  expectedReplyContains?: string[];
  mustNotContain?: string[];
  expectedActions?: string[];
  trailerMustMatch?: string;
  trailerMustNotMatch?: string[];
}

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function callAgent(
  request: APIRequestContext,
  messages: { role: string; content: string }[],
  sessionId: string,
): Promise<string> {
  const res = await request.post(`${BASE}/api/agent/chat`, {
    data: { messages, sessionId },
    headers: { "content-type": "application/json" },
    timeout: 30_000,
  });
  const body = await res.text();
  // Reassemble SSE deltas
  const out: string[] = [];
  for (const line of body.split("\n")) {
    if (!line.startsWith("data:")) continue;
    try {
      const d = JSON.parse(line.slice(5).trim());
      if (typeof d.delta === "string") out.push(d.delta);
    } catch {
      /* ignore */
    }
  }
  return out.join("");
}

// Per ref 25 + ref 27 + ref 28: every dialogue-battery entry runs as its own
// test so failures are precisely attributable. CRITICAL findings fail the
// build; HIGH findings fail in CI but allow local dev to continue.
for (const t of battery.tests as BatteryTest[]) {
  const tag = t.severity === "CRITICAL" ? "@critical" : t.severity === "HIGH" ? "@high" : "@medium";
  test(`[${t.severity}] ${t.id} ${tag}`, async ({ request }) => {
    const session = `battery-${t.id}-${Date.now()}`;
    let reply: string;
    if (t.multiTurn) {
      // Replay the full multi-turn except the last assistant placeholder
      const messages = t.multiTurn.filter((m) => m.content !== "[any]");
      reply = await callAgent(request, messages, session);
    } else if (t.prompt) {
      reply = await callAgent(request, [{ role: "user", content: t.prompt }], session);
    } else {
      throw new Error(`Test ${t.id} has neither prompt nor multiTurn`);
    }

    for (const phrase of t.mustNotContain ?? []) {
      expect(
        reply,
        `mustNotContain violation in ${t.id}: "${phrase}"`,
      ).not.toContain(phrase);
    }
    if (t.expectedReplyContains?.length) {
      const lower = reply.toLowerCase();
      for (const phrase of t.expectedReplyContains) {
        expect(
          lower,
          `expectedReplyContains miss in ${t.id}: "${phrase}"`,
        ).toContain(phrase.toLowerCase());
      }
    }
    if (t.trailerMustMatch) {
      expect(reply, `trailerMustMatch miss in ${t.id}`).toMatch(
        new RegExp(t.trailerMustMatch),
      );
    }
    for (const pattern of t.trailerMustNotMatch ?? []) {
      expect(reply, `trailerMustNotMatch violation in ${t.id}: ${pattern}`).not.toMatch(
        new RegExp(pattern),
      );
    }
    if ((t.expectedActions ?? []).length > 0) {
      // Trailer is "---ACTIONS---\n[...]"
      const trailerMatch = reply.match(/\n---ACTIONS---\n(\[[\s\S]*?\])/);
      if (trailerMatch) {
        try {
          const actions = JSON.parse(trailerMatch[1]) as { type: string }[];
          const types = actions.map((a) => a.type);
          for (const expected of t.expectedActions!) {
            expect(types, `expectedAction ${expected} missing in ${t.id}`).toContain(
              expected,
            );
          }
        } catch {
          // If JSON parse fails the test has surfaced a real malformed trailer
          throw new Error(`Trailer JSON parse failed for ${t.id}: ${trailerMatch[1].slice(0, 100)}`);
        }
      } else {
        throw new Error(`No ---ACTIONS--- trailer found in ${t.id}, expected: ${t.expectedActions}`);
      }
    }
  });
}
