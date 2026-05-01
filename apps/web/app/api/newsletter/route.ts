import { z } from "zod";
import { limit } from "@/lib/rate-limit";
import { hashIp, clientIp } from "@/lib/ip-hash";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email().max(200),
  source: z.string().max(40).optional(),
});

function db(): D1Database | null {
  return (
    ((process.env as unknown as { DB?: D1Database }).DB ??
      (globalThis as unknown as { DB?: D1Database }).DB) ?? null
  );
}

function dl(): KVNamespace | null {
  return (
    ((process.env as unknown as { DEAD_LETTER?: KVNamespace }).DEAD_LETTER ??
      (globalThis as unknown as { DEAD_LETTER?: KVNamespace }).DEAD_LETTER) ?? null
  );
}

/**
 * Newsletter signup — was a console.log stub in Footer.tsx (phantom-UI audit P0 #1).
 *
 * D1 first → KV dead-letter on failure → 503 if neither. No silent drops.
 */
export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req);
  if (!limit(`newsletter:${ip}`, 5, 60).ok) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return Response.json({ ok: false, error: "invalid_json" }, { status: 400 }); }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ ok: false, errors: parsed.error.issues }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const now = Date.now();
  const ipH = await hashIp(req);
  const ua = req.headers.get("user-agent")?.slice(0, 400) ?? null;

  const d = db();
  if (d) {
    try {
      // ON CONFLICT(email) — re-subscribe just bumps updated_at.
      await d
        .prepare(
          `INSERT INTO subscribers (id, email, status, source, consent_given, ip_hash, ua, unsubscribe_token, created_at, updated_at)
           VALUES (?, ?, 'pending', ?, 1, ?, ?, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET status = CASE WHEN subscribers.status = 'unsubscribed' THEN 'pending' ELSE subscribers.status END, updated_at = excluded.updated_at`
        )
        .bind(id, parsed.data.email, parsed.data.source ?? "footer", ipH, ua, token, now, now)
        .run();
      // Per round-3 audit: re-subscribes get the canonical id, not a new one,
      // so clients can dedup. Look up the row and return its actual id +
      // honest 'via' discriminator.
      const row = await d
        .prepare(`SELECT id, status, created_at FROM subscribers WHERE email = ?`)
        .bind(parsed.data.email)
        .first<{ id: string; status: string; created_at: number }>();
      if (row) {
        const isNew = row.created_at === now;
        return Response.json(
          { ok: true, id: row.id, via: isNew ? "primary" : "resubscribed" },
          { status: isNew ? 201 : 200 }
        );
      }
      return Response.json({ ok: true, id, via: "primary" }, { status: 201 });
    } catch (e) {
      console.warn("[newsletter] D1 failed:", (e as Error).message);
    }
  }

  // Dead-letter to KV
  const k = dl();
  if (k) {
    try {
      await k.put(
        `subscriber:${id}`,
        JSON.stringify({ id, email: parsed.data.email, source: parsed.data.source ?? "footer", ip_hash: ipH, ua, created_at: now }),
        { expirationTtl: 60 * 60 * 24 * 30 },
      );
      return Response.json({ ok: true, id, via: "dead-letter" }, { status: 202 });
    } catch (e) {
      console.error("[newsletter] KV dead-letter failed:", (e as Error).message);
    }
  }

  return Response.json(
    { ok: false, error: "storage_unavailable" },
    { status: 503 },
  );
}
