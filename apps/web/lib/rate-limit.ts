/**
 * In-memory token-bucket-ish rate limiter.
 *
 * Keyed by any string; uses a simple fixed-window Map counter. Edge-runtime
 * compatible — no Node built-ins, just Date.now(). In a multi-region edge
 * deployment each isolate keeps its own counter; that's acceptable for Phase 1
 * (the D1-backed durable limiter is a Phase 2 lift per 04-backend-spec §4).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface LimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function limit(
  key: string,
  limitCount: number,
  windowSec: number,
): LimitResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limitCount - 1, resetAt };
  }

  if (existing.count >= limitCount) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limitCount - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Per 05-agent-spec §rate-limits: 30/min and 200/hr per IP hash.
 * Returns the FIRST failing result so the caller can surface the shortest
 * window a client is violating.
 */
export function limitAgentPerIp(ipHash: string): LimitResult {
  const perMinute = limit(`agent:min:${ipHash}`, 30, 60);
  if (!perMinute.ok) return perMinute;

  const perHour = limit(`agent:hr:${ipHash}`, 200, 3600);
  if (!perHour.ok) return perHour;

  return perMinute;
}
