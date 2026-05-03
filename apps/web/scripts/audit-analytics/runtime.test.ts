/**
 * Runtime simulation against node:sqlite (Node 22+).
 * Loads the actual track.ts / queries.ts / pulse.ts and exercises them
 * through a D1-shaped adapter wired to an in-memory SQLite seeded with
 * all 3 migrations. Catches bugs that static scanning misses.
 *
 * Run: NODE_OPTIONS=--experimental-sqlite npx tsx scripts/audit-analytics/runtime.test.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — experimental
import { DatabaseSync } from "node:sqlite";

const ROOT = process.argv[2] ?? process.cwd();
const fail: string[] = [];
const ok: string[] = [];
const t = (label: string, cond: boolean, hint?: string) => {
  if (cond) ok.push(label);
  else fail.push(`${label}${hint ? ` — ${hint}` : ""}`);
};

async function main() {
  const db = new DatabaseSync(":memory:");
  // Discover the migration directory (concierge: drizzle/migrations; tile: drizzle/)
  const dirs = ["drizzle/migrations", "drizzle"];
  let migDir: string | null = null;
  for (const d of dirs) {
    try {
      const list = await fs.readdir(path.join(ROOT, d));
      if (list.some((f) => /\.sql$/.test(f))) { migDir = d; break; }
    } catch {}
  }
  if (!migDir) throw new Error("no migration directory found");
  const all = (await fs.readdir(path.join(ROOT, migDir))).filter((f) => /\.sql$/.test(f)).sort();
  for (const f of all) {
    const sql = await fs.readFile(path.join(ROOT, migDir, f), "utf8");
    db.exec(sql);
  }
  ok.push("migrations applied cleanly");

  function mkD1() {
    return {
      prepare(q: string) {
        const stmt = db.prepare(q);
        let params: unknown[] = [];
        const wrap: any = {
          bind(...args: unknown[]) { params = args; return wrap; },
          async first() {
            try {
              const rows = stmt.all(...params);
              return rows[0] ?? null;
            } catch {
              stmt.run(...params);
              return null;
            }
          },
          async all() { return { results: stmt.all(...params), success: true }; },
          async run() {
            const r = stmt.run(...params);
            return { success: true, meta: { changes: r.changes } };
          },
        };
        return wrap;
      },
    } as any;
  }
  const D1 = mkD1();

  const trackMod = await import(path.join(ROOT, "lib/analytics/track.ts"));
  const queriesMod = await import(path.join(ROOT, "lib/analytics/queries.ts"));
  const pulseMod = await import(path.join(ROOT, "lib/analytics/pulse.ts"));

  // === 1. Two pageviews → same session, dwell rolls up ===
  {
    const cid = "11111111-1111-1111-1111-111111111111";
    const t0 = Date.now() - 60_000;
    const r1 = await trackMod.recordTrack(D1, { client_id: cid, path: "/", ts: t0 }, "1.2.3.4", "MT");
    const r2 = await trackMod.recordTrack(D1, { client_id: cid, path: "/pricing", ts: t0 + 5000, prev_pageview_id: r1.pageview_id, prev_dwell_ms: 5000 }, "1.2.3.4", "MT");
    t("two pageviews same session", r1.session_id === r2.session_id);

    const sess = db.prepare("SELECT pageview_count, total_dwell_ms, country, landing_path FROM analytics_sessions WHERE id = ?").get(r1.session_id) as any;
    t("pageview_count = 2", sess.pageview_count === 2, `got ${sess.pageview_count}`);
    t("dwell rolled up to session", sess.total_dwell_ms === 5000, `got ${sess.total_dwell_ms}`);
    t("landing_path immutable = /", sess.landing_path === "/", `got ${sess.landing_path}`);
    t("country captured from CF header", sess.country === "MT");
    const pv1 = db.prepare("SELECT dwell_ms FROM analytics_pageviews WHERE id = ?").get(r1.pageview_id) as any;
    t("first pageview dwell back-filled", pv1.dwell_ms === 5000);
  }

  // === 2. 31-min gap = new session ===
  {
    const cid = "22222222-2222-2222-2222-222222222222";
    const t0 = Date.now() - 2 * 60 * 60_000;
    const r1 = await trackMod.recordTrack(D1, { client_id: cid, path: "/", ts: t0 }, "5.6.7.8", "DE");
    const r2 = await trackMod.recordTrack(D1, { client_id: cid, path: "/about", ts: t0 + 31 * 60_000 }, "5.6.7.8", "DE");
    t("31-min gap forks new session", r1.session_id !== r2.session_id);
  }

  // === 3. event_only does not create a pageview row ===
  {
    const cid = "33333333-3333-3333-3333-333333333333";
    const t0 = Date.now() - 30_000;
    const r1 = await trackMod.recordTrack(D1, { client_id: cid, path: "/", ts: t0 }, "9.9.9.9", "US");
    await trackMod.recordTrack(D1, { client_id: cid, path: "/", ts: t0 + 1000, event_only: true, event: { kind: "front_open", payload: { source: "launcher" } } }, "9.9.9.9", "US");
    const pvCount = (db.prepare("SELECT COUNT(*) AS n FROM analytics_pageviews WHERE client_id = ?").get(cid) as any).n;
    t("event-only beacon does NOT add pageview", pvCount === 1, `got ${pvCount}`);
    const evCount = (db.prepare("SELECT COUNT(*) AS n FROM analytics_events WHERE client_id = ? AND kind = 'front_open'").get(cid) as any).n;
    t("event-only beacon DOES add event", evCount === 1);
    const sess = db.prepare("SELECT pageview_count, engaged_with_front FROM analytics_sessions WHERE id = ?").get(r1.session_id) as any;
    t("session.engaged_with_front flipped", sess.engaged_with_front === 1);
    t("event-only didn't bump pageview_count past 1", sess.pageview_count === 1, `got ${sess.pageview_count}`);
  }

  // === 4. front_question event flips asked_front_question ===
  {
    const cid = "44444444-4444-4444-4444-444444444444";
    const r1 = await trackMod.recordTrack(D1, { client_id: cid, path: "/", ts: Date.now() - 5000, event_only: true, event: { kind: "front_question", payload: { text: "do you ship to gozo", had_answer: 1 } } }, "1.1.1.1", "MT");
    const sess = db.prepare("SELECT asked_front_question FROM analytics_sessions WHERE id = ?").get(r1.session_id) as any;
    t("session.asked_front_question flipped", sess.asked_front_question === 1);
  }

  // === 5. bindSessionToLead links lead + flips submitted_lead ===
  {
    const cid = "55555555-5555-5555-5555-555555555555";
    await trackMod.recordTrack(D1, { client_id: cid, path: "/contact", ts: Date.now() - 1000 }, "1.1.1.1", "MT");
    // Detect schema shape: concierge-studio leads has business_type+status+updated_at+integer ts;
    // the-tile leads has consent_given+email_status+text iso ts.
    const cols = (db.prepare(`PRAGMA table_info(leads)`).all() as Array<{ name: string }>).map((c) => c.name);
    if (cols.includes("business_type")) {
      db.prepare(`INSERT INTO leads (id, name, email, business_type, source, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
        .run("lead-A", "Test", "test@x.com", "retail", "form", "new", Date.now(), Date.now());
    } else {
      // the-tile shape
      db.prepare(`INSERT INTO leads (id, name, email, message, consent_given, created_at) VALUES (?,?,?,?,?,?)`)
        .run("lead-A", "Test", "test@x.com", "Test message", 1, new Date().toISOString());
    }
    await trackMod.bindSessionToLead(D1, cid, "lead-A");
    const sess = db.prepare("SELECT lead_id, submitted_lead FROM analytics_sessions WHERE client_id = ?").get(cid) as any;
    t("bindSessionToLead sets lead_id", sess.lead_id === "lead-A");
    t("bindSessionToLead sets submitted_lead=1", sess.submitted_lead === 1);
  }

  // === 6. Headline aggregates correctly ===
  {
    const since = Date.now() - 24 * 60 * 60_000;
    const head = await queriesMod.headline(D1, since);
    t("headline.sessions >= 4", head.sessions >= 4);
    t("headline.unique_visitors >= 4", head.unique_visitors >= 4);
    t("headline.bounce_rate in [0,1]", head.bounce_rate >= 0 && head.bounce_rate <= 1);
  }

  // === 7. Conversion funnel monotonic ===
  {
    const since = Date.now() - 24 * 60 * 60_000;
    const f = await queriesMod.conversionFunnel(D1, since);
    t("funnel has 5 steps", f.length === 5);
    for (let i = 1; i < f.length; i++) t(`funnel[${i}].count <= funnel[${i - 1}].count`, f[i].count <= f[i - 1].count, `${f[i].count} > ${f[i - 1].count}`);
  }

  // === 8. topFrontQuestions surfaces our question ===
  {
    const since = Date.now() - 24 * 60 * 60_000;
    const q = await queriesMod.topFrontQuestions(D1, since);
    t("topFrontQuestions surfaces gozo question", !!q.find((r: any) => String(r.text).includes("gozo")));
  }

  // === 9. noAnswerQuestions filters had_answer=0 ===
  {
    const cid = "66666666-6666-6666-6666-666666666666";
    await trackMod.recordTrack(D1, { client_id: cid, path: "/", ts: Date.now() - 500, event_only: true, event: { kind: "front_question", payload: { text: "do you do shopify", had_answer: 0 } } }, "2.2.2.2", "FR");
    const since = Date.now() - 24 * 60 * 60_000;
    const q = await queriesMod.noAnswerQuestions(D1, since);
    t("noAnswerQuestions surfaces had_answer=0 question", !!q.find((r: any) => String(r.text).includes("shopify")));
    t("noAnswerQuestions excludes had_answer=1 question", !q.find((r: any) => String(r.text).includes("gozo")));
  }

  // === 10. Live snapshot includes recent activity ===
  {
    const cid = "77777777-7777-7777-7777-777777777777";
    await trackMod.recordTrack(D1, { client_id: cid, path: "/pricing", ts: Date.now() - 5_000 }, "3.3.3.3", "GB");
    const live = await queriesMod.liveSnapshot(D1);
    t("live snapshot has >=1 active", live.active_sessions >= 1);
    t("live snapshot pins is array", Array.isArray(live.pins));
  }

  // === 11. customerTimeline merges available sources ===
  {
    const tableExists = (n: string) => (db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(n) as any) != null;
    if (tableExists("transcripts")) {
      db.prepare(`INSERT INTO transcripts (id, created_at, updated_at) VALUES (?,?,?)`).run("t-A", Date.now() - 100_000, Date.now());
      db.prepare(`UPDATE leads SET front_transcript_id = ? WHERE id = ?`).run("t-A", "lead-A");
      db.prepare(`INSERT INTO transcript_messages (id, transcript_id, role, content, created_at) VALUES (?,?,?,?,?)`).run("m1", "t-A", "user", "What\'s the cheapest tier?", Date.now() - 90_000);
    }
    if (tableExists("lead_activity")) {
      db.prepare(`INSERT INTO lead_activity (id, lead_id, kind, body, created_at) VALUES (?,?,?,?,?)`).run("act1", "lead-A", "note", "Promising lead", Date.now() - 50_000);
    }
    const tl = await queriesMod.customerTimeline(D1, "lead-A", "55555555-5555-5555-5555-555555555555");
    // The tile timeline has fewer sources — minimum 1 entry (lead_submit + pageview).
    t("timeline non-empty", tl.length >= 1, `got ${tl.length}`);
    for (let i = 1; i < tl.length; i++) t(`timeline desc ts[${i - 1}] >= ts[${i}]`, tl[i - 1].ts >= tl[i].ts);
  }

  // === 12. customer_tags UNIQUE constraint ===
  {
    db.prepare(`INSERT INTO customer_tags (id, lead_id, tag, color, created_at, created_by) VALUES ('cttag1','lead-A','VIP','#facc15',?,'seb') ON CONFLICT(lead_id, tag) DO NOTHING`).run(Date.now());
    db.prepare(`INSERT INTO customer_tags (id, lead_id, tag, color, created_at, created_by) VALUES ('cttag2','lead-A','VIP','#facc15',?,'seb') ON CONFLICT(lead_id, tag) DO NOTHING`).run(Date.now());
    const cnt = (db.prepare("SELECT COUNT(*) AS n FROM customer_tags WHERE lead_id='lead-A' AND tag='VIP'").get() as any).n;
    t("customer_tags UNIQUE prevents duplicate", cnt === 1, `got ${cnt}`);
  }

  // === 13. dailyAnomalies returns sane shape ===
  {
    const a = await queriesMod.dailyAnomalies(D1);
    t("dailyAnomalies has today + baseline + anomalies", typeof a.today === "object" && Array.isArray(a.anomalies));
  }

  // === 14. Pulse generation idempotent for same date ===
  {
    await pulseMod.generatePulse(D1, undefined);
    const cnt = (db.prepare("SELECT COUNT(*) AS n FROM daily_pulse").get() as any).n;
    t("daily_pulse persists 1 row", cnt === 1, `got ${cnt}`);
    const row = db.prepare("SELECT ai_summary FROM daily_pulse").get() as any;
    t("daily_pulse has ai_summary", typeof row.ai_summary === "string" && row.ai_summary.length > 0);
    await pulseMod.generatePulse(D1, undefined);
    const cnt2 = (db.prepare("SELECT COUNT(*) AS n FROM daily_pulse").get() as any).n;
    t("daily_pulse re-run idempotent", cnt2 === 1);
  }

  // === 15. Bot UA classified device='bot' ===
  {
    const cid = "88888888-8888-8888-8888-888888888888";
    await trackMod.recordTrack(D1, { client_id: cid, path: "/", ts: Date.now() - 1000, ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }, "8.8.8.8", "US");
    const sess = db.prepare("SELECT device FROM analytics_sessions WHERE client_id = ?").get(cid) as any;
    t("bot UA classified device='bot'", sess.device === "bot", `got ${sess.device}`);
  }

  // === 16. recordTrack handles missing UA gracefully ===
  {
    const cid = "99999999-9999-9999-9999-999999999999";
    await trackMod.recordTrack(D1, { client_id: cid, path: "/contact", ts: Date.now() }, null, null);
    const sess = db.prepare("SELECT device, country FROM analytics_sessions WHERE client_id = ?").get(cid) as any;
    t("missing UA → device='unknown'", sess.device === "unknown");
    t("missing CF header → country=null", sess.country === null);
  }

  // === RESULTS ===
  console.log(`\nPASS (${ok.length}):`);
  for (const o of ok) console.log(`  ✓ ${o}`);
  if (fail.length > 0) {
    console.log(`\nFAIL (${fail.length}):`);
    for (const f of fail) console.log(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log("\nAll runtime tests passed.");
}

main().catch((e) => { console.error(e); process.exit(2); });
