import type { D1Database } from "@cloudflare/workers-types";
const SESSION_GAP_MS = 30 * 60 * 1000;

export interface TrackPayload {
  event_only?: boolean;
  client_id: string;
  path: string;
  title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ua?: string;
  screen_w?: number;
  screen_h?: number;
  ts: number;
  event?: { kind: string; payload?: Record<string, unknown> };
  prev_pageview_id?: string;
  prev_dwell_ms?: number;
}

function uuid(): string { return crypto.randomUUID(); }

function parseDevice(ua: string | undefined) {
  if (!ua) return { device: "unknown" as const, browser: null, os: null };
  const u = ua.toLowerCase();
  if (/(bot|crawl|spider|slurp|curl|wget|python-requests|monitor|http-client)/.test(u))
    return { device: "bot" as const, browser: null, os: null };
  let device: "mobile" | "tablet" | "desktop" = "desktop";
  if (/ipad|tablet|kindle|playbook|silk/.test(u)) device = "tablet";
  else if (/mobi|iphone|android.*mobile|phone/.test(u)) device = "mobile";
  let browser: string | null = null;
  if (/edg\//.test(u)) browser = "Edge";
  else if (/chrome\//.test(u) && !/edg\//.test(u)) browser = "Chrome";
  else if (/firefox\//.test(u)) browser = "Firefox";
  else if (/safari\//.test(u) && !/chrome\//.test(u)) browser = "Safari";
  let os: string | null = null;
  if (/iphone|ipad|ios/.test(u)) os = "iOS";
  else if (/android/.test(u)) os = "Android";
  else if (/macintosh|mac os/.test(u)) os = "macOS";
  else if (/windows/.test(u)) os = "Windows";
  else if (/linux/.test(u)) os = "Linux";
  return { device, browser, os };
}

function parseHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try { return new URL(referrer).host || null; } catch { return null; }
}

async function hashIp(ip: string | null, day: string): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(`${day}:${ip}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function dayKey(ts: number): string { return new Date(ts).toISOString().slice(0, 10); }

export async function recordTrack(
  db: D1Database, payload: TrackPayload, ip: string | null, cfCountry: string | null
): Promise<{ session_id: string; pageview_id: string }> {
  const now = payload.ts || Date.now();
  const { device, browser, os } = parseDevice(payload.ua);
  const ip_hash = await hashIp(ip, dayKey(now));

  const existing = (await db.prepare(
    `SELECT id, last_seen_at FROM analytics_sessions WHERE client_id = ?1 ORDER BY last_seen_at DESC LIMIT 1`
  ).bind(payload.client_id).first()) as { id: string; last_seen_at: number } | null;

  let session_id: string;
  if (existing && now - Number(existing.last_seen_at) < SESSION_GAP_MS) {
    session_id = existing.id;
    await db.prepare(
      `UPDATE analytics_sessions SET last_seen_at = ?1, pageview_count = pageview_count + 1 WHERE id = ?2`
    ).bind(now, session_id).run();
  } else {
    session_id = uuid();
    const referrer_host = parseHost(payload.referrer);
    await db.prepare(
      `INSERT INTO analytics_sessions (
        id, client_id, landing_path, referrer, referrer_host,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        country, device, browser, os, ua_raw, ip_hash,
        started_at, last_seen_at, pageview_count
      ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?17,1)`
    ).bind(
      session_id, payload.client_id, payload.path, payload.referrer ?? null, referrer_host,
      payload.utm_source ?? null, payload.utm_medium ?? null, payload.utm_campaign ?? null,
      payload.utm_content ?? null, payload.utm_term ?? null,
      cfCountry ?? null, device, browser, os, payload.ua ?? null, ip_hash, now
    ).run();
  }

  if (payload.prev_pageview_id && typeof payload.prev_dwell_ms === "number") {
    const dwell = Math.max(0, Math.min(payload.prev_dwell_ms, 30 * 60 * 1000));
    await db.prepare(
      `UPDATE analytics_pageviews SET dwell_ms = ?1 WHERE id = ?2 AND dwell_ms IS NULL`
    ).bind(dwell, payload.prev_pageview_id).run();
    await db.prepare(
      `UPDATE analytics_sessions SET total_dwell_ms = total_dwell_ms + ?1 WHERE id = ?2`
    ).bind(dwell, session_id).run();
  }

  let pageview_id: string | null = null;
  if (!payload.event_only) {
    pageview_id = uuid();
    await db.prepare(
      `INSERT INTO analytics_pageviews (id, session_id, client_id, path, title, ts) VALUES (?1,?2,?3,?4,?5,?6)`
    ).bind(pageview_id, session_id, payload.client_id, payload.path, payload.title ?? null, now).run();
  } else {
    // event-only beacons should not bump session.pageview_count
    await db.prepare(
      `UPDATE analytics_sessions SET pageview_count = MAX(pageview_count - 1, 0) WHERE id = ?1`
    ).bind(session_id).run();
  }

  if (payload.event && typeof payload.event.kind === "string") {
    await recordEvent(db, {
      session_id, client_id: payload.client_id, kind: payload.event.kind,
      path: payload.path, payload: payload.event.payload, ts: now,
    });
  }

  return { session_id, pageview_id: pageview_id ?? "" };
}

export async function recordEvent(
  db: D1Database,
  ev: { session_id: string; client_id: string; kind: string; path: string; payload?: Record<string, unknown>; ts: number }
): Promise<void> {
  const id = uuid();
  await db.prepare(
    `INSERT INTO analytics_events (id, session_id, client_id, kind, path, payload, ts) VALUES (?1,?2,?3,?4,?5,?6,?7)`
  ).bind(id, ev.session_id, ev.client_id, ev.kind, ev.path, ev.payload ? JSON.stringify(ev.payload) : null, ev.ts).run();

  if (ev.kind === "front_open") {
    await db.prepare(`UPDATE analytics_sessions SET engaged_with_front = 1 WHERE id = ?1`).bind(ev.session_id).run();
  } else if (ev.kind === "front_question") {
    await db.prepare(`UPDATE analytics_sessions SET asked_front_question = 1 WHERE id = ?1`).bind(ev.session_id).run();
  }
}

export async function bindSessionToLead(db: D1Database, client_id: string, lead_id: string): Promise<void> {
  await db.prepare(
    `UPDATE analytics_sessions SET lead_id = ?1, submitted_lead = 1 WHERE client_id = ?2 AND lead_id IS NULL`
  ).bind(lead_id, client_id).run();
}
