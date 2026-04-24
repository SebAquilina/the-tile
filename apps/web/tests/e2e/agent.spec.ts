import { expect, test } from "@playwright/test";

test.describe("Agent streaming (requires GEMINI_API_KEY)", () => {
  test.skip(
    !process.env.GEMINI_API_KEY,
    "Set GEMINI_API_KEY to run the live streaming smoke test.",
  );

  test("agent chat endpoint streams SSE with non-empty deltas", async ({
    request,
  }) => {
    const res = await request.post("/api/agent/chat", {
      headers: { "content-type": "application/json" },
      data: {
        sessionId: "e2e-playwright",
        messages: [{ role: "user", content: "show me marble tiles" }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("data:");
    // At least one delta frame with non-empty payload.
    expect(text).toMatch(/data: \{"delta":"[^"]+"\}/);
    expect(text).toContain("[DONE]");
  });
});
