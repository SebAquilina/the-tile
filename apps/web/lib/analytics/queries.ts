import type { D1Database } from "@cloudflare/workers-types";

export type Window = "24h" | "7d" | "30d" | "90d";
export function windowMs(w: Window): number {
  switch (w) {
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
  }
}

export async function headline(db: D1Database, since: number) {
  const sessions = ((await db.prepare(
    `SELECT
       COUNT(*) AS n, COUNT(DISTINCT client_id) AS visitors,
       AVG(total_dwell_ms) AS avg_dwell_ms, SUM(pageview_count) AS pageviews,
       SUM(CASE WHEN pageview_count = 1 THEN 1 ELSE 0 END) AS bounces,
       SUM(CASE WHEN device = 'mobile' THEN 1 ELSE 0 END) AS mobile,
       SUM(CASE WHEN device = 'desktop' THEN 1 ELSE 0 END) AS desktop,
       SUM(CASE WHEN device = 'tablet' THEN 1 ELSE 0 END) AS tablet
     FROM analytics_sessions WHERE started_at >= ?1 AND device != 'bot'`
  ).bind(since).first()) ?? {}) as Record<string, number | null>;
  const n = Number(sessions.n) || 0;
  const bounce_rate = n > 0 ? Number(sessions.bounces ?? 0) / n : 0;
  const mobile_share = n > 0 ? Number(sessions.mobile ?? 0) / n : 0;
  return {
    sessions: n,
    unique_visitors: Number(sessions.visitors) || 0,
    pageviews: Number(sessions.pageviews) || 0,
    avg_dwell_seconds: Math.round(Number(sessions.avg_dwell_ms ?? 0) / 1000),
    bounce_rate, mobile_share,
    device_split: {
      mobile: Number(sessions.mobile) || 0,
      desktop: Number(sessions.desktop) || 0,
      tablet: Number(sessions.tablet) || 0,
    },
  };
}

export async function conversionFunnel(db: D1Database, since: number) {
  const r = ((await db.prepare(
    `SELECT COUNT(*) AS sessions, SUM(engaged_with_front) AS engaged,
            SUM(asked_front_question) AS asked, SUM(submitted_lead) AS leads,
            SUM(converted_to_won) AS won
     FROM analytics_sessions WHERE started_at >= ?1 AND device != 'bot'`
  ).bind(since).first()) ?? {}) as Record<string, number | null>;
  const sessions = Number(r.sessions) || 0;
  const engaged = Number(r.engaged) || 0, asked = Number(r.asked) || 0;
  const leads = Number(r.leads) || 0, won = Number(r.won) || 0;
  const pct = (n: number) => sessions > 0 ? n / sessions : 0;
  return [
    { step: "Sessions", count: sessions, pct: 1, drop_pct: 0 },
    { step: "Engaged with Front", count: engaged, pct: pct(engaged), drop_pct: 1 - pct(engaged) },
    { step: "Asked Front a question", count: asked, pct: pct(asked), drop_pct: pct(engaged) - pct(asked) },
    { step: "Submitted lead", count: leads, pct: pct(leads), drop_pct: pct(asked) - pct(leads) },
    { step: "Won", count: won, pct: pct(won), drop_pct: pct(leads) - pct(won) },
  ];
}

export async function topFrontQuestions(db: D1Database, since: number, limit = 25) {
  const rows = await db.prepare(
    `SELECT COALESCE(json_extract(payload,'$.text'), '(no text)') AS text,
            COUNT(*) AS hits,
            SUM(CASE WHEN COALESCE(json_extract(payload,'$.had_answer'), 1) = 1 THEN 1 ELSE 0 END) AS answered,
            SUM(CASE WHEN COALESCE(json_extract(payload,'$.had_answer'), 1) = 0 THEN 1 ELSE 0 END) AS no_answer
     FROM analytics_events WHERE kind = 'front_question' AND ts >= ?1
     GROUP BY text ORDER BY hits DESC LIMIT ?2`
  ).bind(since, limit).all();
  return (rows.results as Record<string, unknown>[]) ?? [];
}

export async function noAnswerQuestions(db: D1Database, since: number, limit = 25) {
  const rows = await db.prepare(
    `SELECT COALESCE(json_extract(payload,'$.text'), '(no text)') AS text,
            COUNT(*) AS hits, MAX(ts) AS last_seen
     FROM analytics_events
     WHERE (kind = 'front_no_answer'
            OR (kind = 'front_question' AND COALESCE(json_extract(payload,'$.had_answer'), 1) = 0))
       AND ts >= ?1
     GROUP BY text ORDER BY hits DESC, last_seen DESC LIMIT ?2`
  ).bind(since, limit).all();
  return (rows.results as Record<string, unknown>[]) ?? [];
}

export async function sessionsByLandingPage(db: D1Database, since: number, limit = 20) {
  const rows = await db.prepare(
    `SELECT landing_path AS path, COUNT(*) AS sessions,
            AVG(total_dwell_ms) AS avg_dwell_ms,
            SUM(CASE WHEN pageview_count = 1 THEN 1 ELSE 0 END) AS bounces,
            SUM(submitted_lead) AS leads
     FROM analytics_sessions WHERE started_at >= ?1 AND device != 'bot'
     GROUP BY landing_path ORDER BY sessions DESC LIMIT ?2`
  ).bind(since, limit).all();
  return ((rows.results as Record<string, unknown>[]) ?? []).map((r) => ({
    ...r,
    bounce_rate: Number(r.sessions) > 0 ? Number(r.bounces) / Number(r.sessions) : 0,
    avg_dwell_seconds: Math.round(Number(r.avg_dwell_ms ?? 0) / 1000),
    lead_rate: Number(r.sessions) > 0 ? Number(r.leads) / Number(r.sessions) : 0,
  } as Record<string, unknown>));
}

export async function sessionsByDevice(db: D1Database, since: number) {
  const rows = await db.prepare(
    `SELECT device, COUNT(*) AS sessions, SUM(submitted_lead) AS leads, AVG(total_dwell_ms) AS avg_dwell_ms
     FROM analytics_sessions WHERE started_at >= ?1 AND device != 'bot'
     GROUP BY device ORDER BY sessions DESC`
  ).bind(since).all();
  return ((rows.results as Record<string, unknown>[]) ?? []).map((r) => ({
    ...r,
    avg_dwell_seconds: Math.round(Number(r.avg_dwell_ms ?? 0) / 1000),
    lead_rate: Number(r.sessions) > 0 ? Number(r.leads) / Number(r.sessions) : 0,
  } as Record<string, unknown>));
}

export async function sessionsByCountry(db: D1Database, since: number, limit = 25) {
  const rows = await db.prepare(
    `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS sessions, SUM(submitted_lead) AS leads
     FROM analytics_sessions WHERE started_at >= ?1 AND device != 'bot'
     GROUP BY country ORDER BY sessions DESC LIMIT ?2`
  ).bind(since, limit).all();
  return (rows.results as Record<string, unknown>[]) ?? [];
}

export async function topReferrers(db: D1Database, since: number, limit = 15) {
  const rows = await db.prepare(
    `SELECT COALESCE(referrer_host, '(direct)') AS host, COUNT(*) AS sessions, SUM(submitted_lead) AS leads
     FROM analytics_sessions WHERE started_at >= ?1 AND device != 'bot'
     GROUP BY host ORDER BY sessions DESC LIMIT ?2`
  ).bind(since, limit).all();
  return (rows.results as Record<string, unknown>[]) ?? [];
}

export async function topPages(db: D1Database, since: number, limit = 20) {
  const rows = await db.prepare(
    `SELECT path, COUNT(*) AS views, AVG(dwell_ms) AS avg_dwell_ms
     FROM analytics_pageviews WHERE ts >= ?1
     GROUP BY path ORDER BY views DESC LIMIT ?2`
  ).bind(since, limit).all();
  return ((rows.results as Record<string, unknown>[]) ?? []).map((r) => ({
    ...r,
    avg_dwell_seconds: Math.round(Number(r.avg_dwell_ms ?? 0) / 1000),
  } as Record<string, unknown>));
}

export async function promptPerformance(db: D1Database, since: number) {
  const rows = await db.prepare(
    `SELECT COALESCE(json_extract(payload,'$.label'), '(unknown)') AS label,
            COUNT(*) AS clicks,
            SUM(CASE WHEN session_id IN (SELECT id FROM analytics_sessions WHERE submitted_lead = 1) THEN 1 ELSE 0 END) AS leads
     FROM analytics_events WHERE kind = 'prompt_click' AND ts >= ?1
     GROUP BY label ORDER BY clicks DESC LIMIT 20`
  ).bind(since).all();
  return ((rows.results as Record<string, unknown>[]) ?? []).map((r) => ({
    ...r,
    lead_rate: Number(r.clicks) > 0 ? Number(r.leads) / Number(r.clicks) : 0,
  } as Record<string, unknown>));
}

export async function liveSnapshot(db: D1Database) {
  const now = Date.now();
  const since60s = now - 60_000;
  const sinceStartOfDay = new Date().setHours(0, 0, 0, 0);

  const active = ((await db.prepare(
    `SELECT COUNT(*) AS active_sessions, SUM(engaged_with_front) AS active_in_front,
            SUM(CASE WHEN reached_quote_step = 1 THEN 1 ELSE 0 END) AS in_quote_flow
     FROM analytics_sessions WHERE last_seen_at >= ?1 AND device != 'bot'`
  ).bind(since60s).first()) ?? {}) as Record<string, number | null>;

  const today = ((await db.prepare(
    `SELECT COUNT(*) AS sessions_today, SUM(pageview_count) AS pageviews_today, SUM(submitted_lead) AS leads_today
     FROM analytics_sessions WHERE started_at >= ?1 AND device != 'bot'`
  ).bind(sinceStartOfDay).first()) ?? {}) as Record<string, number | null>;

  const pins = await db.prepare(
    `SELECT COALESCE(country,'??') AS country, landing_path, device, last_seen_at, id
     FROM analytics_sessions WHERE last_seen_at >= ?1 AND device != 'bot'
     ORDER BY last_seen_at DESC LIMIT 50`
  ).bind(since60s).all();

  return {
    active_sessions: Number(active.active_sessions) || 0,
    active_in_front: Number(active.active_in_front) || 0,
    in_quote_flow: Number(active.in_quote_flow) || 0,
    sessions_today: Number(today.sessions_today) || 0,
    pageviews_today: Number(today.pageviews_today) || 0,
    leads_today: Number(today.leads_today) || 0,
    pins: (pins.results as Record<string, unknown>[]) ?? [],
    fetched_at: now,
  };
}

export interface TimelineRow {
  ts: number;
  kind: string;
  source: "activity" | "transcript" | "pageview" | "event";
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
}

export async function customerTimeline(
  db: D1Database, lead_id: string, client_id?: string | null
): Promise<TimelineRow[]> {
  const rows: TimelineRow[] = [];

  // The lead-creation event itself (replaces concierge-studio's lead_activity feed).
  try {
    const ld = (await db.prepare(
      `SELECT name, email, message, created_at FROM leads WHERE id = ?1`
    ).bind(lead_id).first()) as { name?: string; email?: string; message?: string; created_at?: string } | null;
    if (ld) {
      const ts = ld.created_at ? Date.parse(String(ld.created_at)) : Date.now();
      rows.push({
        ts: Number.isFinite(ts) ? ts : Date.now(),
        kind: "lead_submit",
        source: "activity",
        title: "Submitted contact form",
        body: ld.message ?? undefined,
      });
    }
  } catch { /* leads table missing? unlikely */ }

  // Concierge sessions linked by ip_hash (the-tile's agent_sessions doesn't store
  // message bodies — Phase 6 hardens transcripts later if/when richer telemetry
  // is needed). For now we surface "Started a chat with the concierge" pings.
  if (client_id) {
    try {
      const ases = await db.prepare(
        `SELECT id, created_at, last_seen_at, turns FROM agent_sessions
         WHERE created_at >= datetime('now','-90 days') ORDER BY created_at DESC LIMIT 30`
      ).bind().all();
      for (const a of (ases.results as Record<string, unknown>[]) ?? []) {
        const ts = a.created_at ? Date.parse(String(a.created_at)) : 0;
        if (!ts) continue;
        rows.push({
          ts,
          kind: "agent_session",
          source: "transcript",
          title: `Started a chat with the concierge (${Number(a.turns) || 0} turns)`,
        });
      }
    } catch { /* table-missing or schema drift — don't crash the timeline */ }
  }

  if (client_id) {
    const pvs = await db.prepare(
      `SELECT path, ts, dwell_ms FROM analytics_pageviews WHERE client_id = ?1 ORDER BY ts DESC LIMIT 80`
    ).bind(client_id).all();
    for (const v of (pvs.results as Record<string, unknown>[]) ?? []) {
      rows.push({
        ts: Number(v.ts),
        kind: "pageview",
        source: "pageview",
        title: `Visited ${v.path}`,
        meta: { dwell_ms: v.dwell_ms },
      });
    }
    const evs = await db.prepare(
      `SELECT kind, path, payload, ts FROM analytics_events
       WHERE client_id = ?1 AND kind != 'session_end' ORDER BY ts DESC LIMIT 80`
    ).bind(client_id).all();
    for (const e of (evs.results as Record<string, unknown>[]) ?? []) {
      rows.push({
        ts: Number(e.ts),
        kind: String(e.kind),
        source: "event",
        title: friendlyEventTitle(String(e.kind), e.payload as string | null),
        meta: { path: e.path, payload: e.payload },
      });
    }
  }

  rows.sort((a, b) => b.ts - a.ts);
  return rows;
}

function friendlyActivityTitle(kind: string, from_value: string | null, to_value: string | null): string {
  switch (kind) {
    case "status_change": return `Status changed${from_value ? ` from ${from_value}` : ""}${to_value ? ` to ${to_value}` : ""}`;
    case "note": return "Internal note";
    case "quote_sent": return "Quote sent";
    case "call_logged": return "Call logged";
    case "email_sent": return "Email sent";
    case "build_started": return "Build kicked off";
    case "build_completed": return "Build completed";
    default: return kind;
  }
}

function friendlyEventTitle(kind: string, payload: string | null): string {
  let p: Record<string, unknown> = {};
  try { if (payload) p = JSON.parse(payload) as Record<string, unknown>; } catch {}
  switch (kind) {
    case "front_open": return "Opened the concierge";
    case "front_question": return `Asked Front: "${(p.text as string)?.slice(0, 80) ?? ""}"`;
    case "front_no_answer": return `Front had no answer for: "${(p.text as string)?.slice(0, 80) ?? ""}"`;
    case "prompt_click": return `Clicked prompt: "${(p.label as string)?.slice(0, 80) ?? ""}"`;
    case "cta_click": return `Clicked CTA: ${(p.label as string)?.slice(0, 60) ?? ""}`;
    case "form_submit": return "Submitted a form";
    case "quote_view": return "Viewed their quote";
    case "quote_accept": return "Accepted their quote";
    case "scroll_75": return "Scrolled 75% of a page";
    default: return kind;
  }
}

export async function dailyAnomalies(db: D1Database) {
  const now = Date.now();
  const today = await headline(db, now - 24 * 60 * 60 * 1000);
  const baseline = await headline(db, now - 8 * 24 * 60 * 60 * 1000);
  const baselineAvg = {
    sessions: Math.round((baseline.sessions - today.sessions) / 7),
    leads: 0,
    bounce_rate: baseline.bounce_rate,
    mobile_share: baseline.mobile_share,
  };

  // the-tile's leads.created_at is TEXT ISO, not INTEGER. Compare ISO-to-ISO.
  const todayCutoffIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const weekAgoIso = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
  const todayLeadsRow = ((await db.prepare(
    `SELECT COUNT(*) AS n FROM leads WHERE created_at >= ?1`
  ).bind(todayCutoffIso).first()) ?? {}) as { n?: number };
  const baselineLeadsRow = ((await db.prepare(
    `SELECT COUNT(*) AS n FROM leads WHERE created_at >= ?1 AND created_at < ?2`
  ).bind(weekAgoIso, todayCutoffIso).first()) ?? {}) as { n?: number };

  const todayLeads = Number(todayLeadsRow.n) || 0;
  const baselineLeadsAvg = (Number(baselineLeadsRow.n) || 0) / 7;
  baselineAvg.leads = baselineLeadsAvg;

  const anomalies: { kind: string; severity: "info" | "warn" | "alert"; message: string; delta_pct: number }[] = [];
  function cmp(label: string, today: number, baseline: number, kind: string) {
    if (baseline < 0.5) return;
    const delta = (today - baseline) / baseline;
    if (Math.abs(delta) >= 0.25) {
      const direction = delta > 0 ? "↑" : "↓";
      anomalies.push({
        kind,
        severity: delta < -0.4 ? "alert" : "warn",
        message: `${label}: ${today.toLocaleString()} today vs ${Math.round(baseline)} baseline ${direction} ${Math.round(Math.abs(delta) * 100)}%`,
        delta_pct: Math.round(delta * 100),
      });
    }
  }
  cmp("Sessions", today.sessions, baselineAvg.sessions, "sessions");
  cmp("Leads", todayLeads, baselineAvg.leads, "leads");
  cmp("Mobile share", Math.round(today.mobile_share * 100), Math.round(baselineAvg.mobile_share * 100), "mobile_share");
  cmp("Bounce rate", Math.round(today.bounce_rate * 100), Math.round(baselineAvg.bounce_rate * 100), "bounce_rate");

  return { today, baseline: baselineAvg, todayLeads, anomalies };
}
