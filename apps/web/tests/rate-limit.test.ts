import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { limit } from "@/lib/rate-limit";

describe("rate-limit.limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to N calls in a window then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const r = limit(key, 5, 60);
      expect(r.ok).toBe(true);
    }
    const blocked = limit(key, 5, 60);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("keeps keys independent", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 3; i++) limit(a, 3, 60);
    const aBlocked = limit(a, 3, 60);
    const bAllowed = limit(b, 3, 60);
    expect(aBlocked.ok).toBe(false);
    expect(bAllowed.ok).toBe(true);
  });

  it("resets after the window expires", () => {
    const key = `reset-${Math.random()}`;
    for (let i = 0; i < 3; i++) limit(key, 3, 60);
    expect(limit(key, 3, 60).ok).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(limit(key, 3, 60).ok).toBe(true);
  });
});
