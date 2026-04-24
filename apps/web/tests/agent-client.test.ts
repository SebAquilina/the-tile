import { describe, expect, it } from "vitest";
import { parseActionTrailer } from "@/lib/agent-client";

describe("parseActionTrailer", () => {
  it("extracts a canonical trailer with a single navigate action", () => {
    const raw = [
      "Here are a few to look at.",
      "",
      "---ACTIONS---",
      '[{"type":"navigate","data":{"url":"/collections/marble"}}]',
    ].join("\n");

    const result = parseActionTrailer(raw);
    expect(result.visibleText).toBe("Here are a few to look at.");
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].type).toBe("navigate");
  });

  it("extracts multi-action trailers", () => {
    const raw = [
      "Good picks.",
      "",
      "---ACTIONS---",
      '[',
      '  {"type":"filter","data":{"usage":"bathroom"}},',
      '  {"type":"highlight-products","data":{"ids":["tele-di-marmo-revolution","unique-marble"]}}',
      ']',
    ].join("\n");

    const result = parseActionTrailer(raw);
    expect(result.actions.length).toBeGreaterThanOrEqual(2);
    expect(result.visibleText).toBe("Good picks.");
  });

  it("handles a code-fenced trailer", () => {
    const raw = [
      "Done.",
      "",
      "---ACTIONS---",
      "```json",
      '[{"type":"navigate","data":{"url":"/collections/wood"}}]',
      "```",
    ].join("\n");

    const result = parseActionTrailer(raw);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].type).toBe("navigate");
  });

  it("returns empty actions for malformed trailer JSON", () => {
    const raw = [
      "Oops.",
      "",
      "---ACTIONS---",
      "{ not json",
    ].join("\n");

    const result = parseActionTrailer(raw);
    expect(result.actions).toEqual([]);
    expect(result.visibleText).toBe("Oops.");
  });

  it("returns the full text and no actions when no trailer present", () => {
    const raw = "Plain reply, no action needed.";
    const result = parseActionTrailer(raw);
    expect(result.visibleText).toBe(raw);
    expect(result.actions).toEqual([]);
  });
});
