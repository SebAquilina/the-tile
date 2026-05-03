import type { D1Database } from "@cloudflare/workers-types";
import { headline, dailyAnomalies } from "./queries";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

function todayUtcKey(): string { return new Date().toISOString().slice(0, 10); }
function uuid() { return crypto.randomUUID(); }

interface PulseInputs {
  date: string;
  today: Awaited<ReturnType<typeof headline>>;
  baseline: { sessions: number; leads: number; bounce_rate: number; mobile_share: number };
  todayLeads: number;
  anomalies: { kind: string; severity: string; message: string; delta_pct: number }[];
  topCountry?: string;
  topLanding?: string;
  topReferrer?: string;
}

async function summariseWithGemini(inputs: PulseInputs, apiKey: string | undefined): Promise<string> {
  if (!apiKey) return fallbackSummary(inputs);
  const prompt = [
    "You are a small-business analytics analyst. Write 4–6 short markdown bullets summarising today's website performance for the operator.",
    "Tone: direct, no filler, no marketing language. Each bullet is one sentence ending with a period.",
    "Highlight the most actionable thing first. If there are anomalies, lead with the most severe.",
    "If conversion is healthy and nothing is unusual, say so plainly without inventing problems.",
    "Do NOT mention 'Lighthouse', 'Cloudflare', 'Gemini', 'GitHub', or any developer tooling.",
    "",
    `Date: ${inputs.date}`,
    `Sessions today: ${inputs.today.sessions} (baseline ${inputs.baseline.sessions}/day)`,
    `Leads today: ${inputs.todayLeads} (baseline ${inputs.baseline.leads.toFixed(1)}/day)`,
    `Avg dwell: ${inputs.today.avg_dwell_seconds}s`,
    `Bounce: ${(inputs.today.bounce_rate * 100).toFixed(0)}% (baseline ${(inputs.baseline.bounce_rate * 100).toFixed(0)}%)`,
    `Mobile share: ${(inputs.today.mobile_share * 100).toFixed(0)}% (baseline ${(inputs.baseline.mobile_share * 100).toFixed(0)}%)`,
    `Top country: ${inputs.topCountry ?? "(unknown)"}`,
    `Top landing page: ${inputs.topLanding ?? "(unknown)"}`,
    `Top referrer: ${inputs.topReferrer ?? "(direct)"}`,
    `Anomalies (>25% delta): ${inputs.anomalies.map((a) => a.message).join("; ") || "none"}`,
  ].join("\n");

  try {
    const r = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      }),
    });
    if (!r.ok) throw new Error(`gemini ${r.status}`);
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    return text || fallbackSummary(inputs);
  } catch (e) {
    console.warn("[pulse] gemini failed, using fallback:", (e as Error).message);
    return fallbackSummary(inputs);
  }
}

function fallbackSummary(inputs: PulseInputs): string {
  const lines: string[] = [];
  if (inputs.anomalies.length > 0) {
    for (const a of inputs.anomalies.slice(0, 3)) lines.push(`- ${a.message}.`);
  } else {
    lines.push(`- ${inputs.today.sessions.toLocaleString()} sessions today, in line with the ${inputs.baseline.sessions}/day baseline.`);
  }
  lines.push(`- ${inputs.todayLeads} new lead${inputs.todayLeads === 1 ? "" : "s"} today (${inputs.baseline.leads.toFixed(1)}/day baseline).`);
  lines.push(`- Bounce rate ${(inputs.today.bounce_rate * 100).toFixed(0)}%, mobile share ${(inputs.today.mobile_share * 100).toFixed(0)}%.`);
  if (inputs.topLanding) lines.push(`- Most-entered page: ${inputs.topLanding}.`);
  if (inputs.topReferrer && inputs.topReferrer !== "(direct)") lines.push(`- Top referrer: ${inputs.topReferrer}.`);
  return lines.join("\n");
}

export async function generatePulse(
  db: D1Database, geminiKey: string | undefined, forDate?: string
): Promise<{ id: string; ai_summary: string; anomalies: PulseInputs["anomalies"] }> {
  const date = forDate ?? todayUtcKey();
  const startOfDay = new Date(`${date}T00:00:00.000Z`).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

  const todayMetrics = await headline(db, startOfDay);
  const anom = await dailyAnomalies(db);

  const topCountry = ((await db.prepare(
    `SELECT country, COUNT(*) AS n FROM analytics_sessions
     WHERE started_at >= ?1 AND started_at < ?2 AND device != 'bot' AND country IS NOT NULL
     GROUP BY country ORDER BY n DESC LIMIT 1`
  ).bind(startOfDay, endOfDay).first()) as { country?: string } | null)?.country ?? undefined;

  const topLanding = ((await db.prepare(
    `SELECT landing_path, COUNT(*) AS n FROM analytics_sessions
     WHERE started_at >= ?1 AND started_at < ?2 AND device != 'bot'
     GROUP BY landing_path ORDER BY n DESC LIMIT 1`
  ).bind(startOfDay, endOfDay).first()) as { landing_path?: string } | null)?.landing_path ?? undefined;

  const topReferrer = ((await db.prepare(
    `SELECT referrer_host, COUNT(*) AS n FROM analytics_sessions
     WHERE started_at >= ?1 AND started_at < ?2 AND device != 'bot' AND referrer_host IS NOT NULL
     GROUP BY referrer_host ORDER BY n DESC LIMIT 1`
  ).bind(startOfDay, endOfDay).first()) as { referrer_host?: string } | null)?.referrer_host ?? undefined;

  const inputs: PulseInputs = {
    date, today: todayMetrics, baseline: anom.baseline, todayLeads: anom.todayLeads,
    anomalies: anom.anomalies, topCountry, topLanding, topReferrer,
  };

  const ai_summary = await summariseWithGemini(inputs, geminiKey);

  // the-tile has no quotes pipeline; substitute lead-create counts (ISO-typed).
  const dayStartIso = new Date(startOfDay).toISOString();
  const dayEndIso = new Date(endOfDay).toISOString();
  const qSent = 0;
  const qAccepted = ((await db.prepare(
    `SELECT COUNT(*) AS n FROM leads WHERE created_at >= ?1 AND created_at < ?2`
  ).bind(dayStartIso, dayEndIso).first()) as { n?: number } | null)?.n ?? 0;

  const f = ((await db.prepare(
    `SELECT SUM(engaged_with_front) AS engaged, SUM(asked_front_question) AS asked
     FROM analytics_sessions WHERE started_at >= ?1 AND started_at < ?2 AND device != 'bot'`
  ).bind(startOfDay, endOfDay).first()) ?? {}) as Record<string, number | null>;

  const id = uuid();
  await db.prepare(
    `INSERT OR REPLACE INTO daily_pulse (
      id, pulse_date, sessions, pageviews, unique_visitors, avg_dwell_seconds, bounce_rate,
      engaged, asked_front, leads, quotes_sent, quotes_accepted,
      mobile_share, top_country, top_landing_path, top_referrer_host,
      ai_summary, anomalies_json, generated_at
    ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19)`
  ).bind(
    id, date,
    todayMetrics.sessions, todayMetrics.pageviews, todayMetrics.unique_visitors,
    todayMetrics.avg_dwell_seconds, todayMetrics.bounce_rate,
    Number(f.engaged) || 0, Number(f.asked) || 0,
    anom.todayLeads, qSent, qAccepted,
    todayMetrics.mobile_share,
    topCountry ?? null, topLanding ?? null, topReferrer ?? null,
    ai_summary, JSON.stringify(anom.anomalies), Date.now()
  ).run();

  return { id, ai_summary, anomalies: anom.anomalies };
}

export async function listPulses(db: D1Database, limit = 30) {
  const r = await db.prepare(`SELECT * FROM daily_pulse ORDER BY pulse_date DESC LIMIT ?1`).bind(limit).all();
  return (r.results as Record<string, unknown>[]) ?? [];
}
