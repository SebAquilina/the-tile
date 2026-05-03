/**
 * Audit the analytics build for logic holes, schema mismatches, and security
 * issues that compile-time checks won't catch.
 *
 * Run: pnpm tsx scripts/audit-analytics/run.ts
 */
import { promises as fs } from "fs";
import path from "path";

interface Finding {
  severity: "P0" | "P1" | "P2" | "info";
  area: string;
  msg: string;
}
const out: Finding[] = [];
const found = (f: Finding) => out.push(f);

const ROOT = process.argv[2] ?? process.cwd();
const read = async (rel: string) => fs.readFile(path.join(ROOT, rel), "utf8");
const exists = async (rel: string) =>
  fs.access(path.join(ROOT, rel)).then(() => true).catch(() => false);

// ============================================================
// 1. Migration sanity — every column we INSERT into in track.ts
//    must exist in the migration; every column the queries SELECT
//    from must too.
// ============================================================
async function migrationCoverage() {
  const sql = await (async () => {
    // Find any *_analytics.sql under drizzle/ or drizzle/migrations/
    const dirs = ["drizzle/migrations", "drizzle"];
    for (const d of dirs) {
      try {
        const list = await fs.readdir(path.join(ROOT, d));
        const m = list.find((f) => /analytics\.sql$/i.test(f));
        if (m) return read(`${d}/${m}`);
      } catch {}
    }
    throw new Error("no analytics migration found");
  })();
  const track = await read("lib/analytics/track.ts");
  const queries = await read("lib/analytics/queries.ts");
  const pulse = await read("lib/analytics/pulse.ts");
  const customer = await read("lib/customer/store.ts");

  // Pull every column referenced in INSERT/UPDATE/SELECT
  const tables = new Set(["analytics_sessions", "analytics_pageviews", "analytics_events", "customer_tags", "customer_notes", "daily_pulse"]);
  const referenced = new Set<string>();
  for (const file of [track, queries, pulse, customer]) {
    // crude: pull tokens after FROM/UPDATE/INSERT INTO matching our tables
    for (const t of tables) {
      const re = new RegExp(`\\b(?:FROM|UPDATE|INSERT INTO)\\s+${t}\\b`, "g");
      while (re.exec(file)) referenced.add(t);
    }
  }
  for (const t of tables) {
    if (!referenced.has(t)) {
      found({ severity: "info", area: "schema", msg: `Table ${t} declared but not referenced.` });
    }
  }
  // Verify each column referenced in INSERT lists exists in CREATE TABLE
  // (keyed on session insert which has 19 cols)
  const insertMatch = track.match(/INSERT INTO analytics_sessions \(([^)]+)\)/);
  if (insertMatch) {
    const cols = insertMatch[1].split(",").map((s) => s.trim());
    for (const c of cols) {
      if (!new RegExp(`\\b${c}\\b`).test(sql)) {
        found({ severity: "P0", area: "schema", msg: `track.ts inserts column '${c}' but no such column in 0003_analytics.sql` });
      }
    }
  }
}

// ============================================================
// 2. /api/track payload contract — does the client TrackingPixel
//    send fields the server expects?
// ============================================================
async function trackContract() {
  const px = await read("components/analytics/TrackingPixel.tsx");
  const route = await read("app/api/track/route.ts");

  const clientFields = ["client_id", "path", "title", "referrer", "utm_source", "utm_medium", "utm_campaign", "ts", "prev_pageview_id", "prev_dwell_ms"];
  for (const f of clientFields) {
    if (!new RegExp(`\\b${f}\\b`).test(px)) {
      found({ severity: "P1", area: "track-contract", msg: `Pixel never sends '${f}'` });
    }
    if (!new RegExp(`\\b${f}\\b`).test(route)) {
      found({ severity: "P1", area: "track-contract", msg: `Route never reads '${f}'` });
    }
  }
}

// ============================================================
// 3. Phantom pageview: trackEvent("front_open") posts to /api/track
//    which always inserts a pageview row — every event creates a fake hit.
// ============================================================
async function phantomPageviewBug() {
  const route = await read("app/api/track/route.ts");
  // route always calls recordTrack which always inserts pageview
  if (/await recordTrack\(/.test(route) && !/event_only|skipPageview/.test(route)) {
    found({
      severity: "P0",
      area: "phantom-pageview",
      msg: "trackEvent() beacons hit /api/track which unconditionally writes a pageview row → every event inflates pageview counts.",
    });
  }
}

// ============================================================
// 4. Front no-answer detection: front_question always sets had_answer:1.
//    "Questions With No Good Answer" report will be empty forever.
// ============================================================
async function noAnswerCoverage() {
  const front = await (async () => {
    for (const f of ["components/front/Front.tsx", "components/agent/AgentPanel.tsx"]) {
      try { return await read(f); } catch {}
    }
    return "";
  })();
  if (/had_answer:\s*1/.test(front) && !/had_answer:\s*0|front_no_answer/.test(front)) {
    found({
      severity: "P1",
      area: "no-answer",
      msg: "Front.tsx always sends had_answer:1; never emits front_no_answer. The 'Questions With No Good Answer' report will be empty forever.",
    });
  }
}

// ============================================================
// 5. Bot writes — recordTrack writes session+pageview for bot UAs.
//    We filter bot=device='bot' on read, but D1 is filling up.
// ============================================================
async function botWrites() {
  const track = await read("lib/analytics/track.ts");
  const route = await read("app/api/track/route.ts");
  if (/device: "bot"/.test(track) && !/BOT_RE|skipBots|status:\s*204/.test(route)) {
    found({
      severity: "P2",
      area: "bot-writes",
      msg: "Bot pageviews are stored, then filtered on read. Cheaper to 204 early.",
    });
  }
}

// ============================================================
// 6. Rate limit on /api/track
// ============================================================
async function rateLimit() {
  const route = await read("app/api/track/route.ts");
  if (!/limit\(|rate.?limit|ratelimit/i.test(route)) {
    found({
      severity: "P1",
      area: "rate-limit",
      msg: "/api/track has no rate-limit. A bad actor can write unlimited rows to D1.",
    });
  }
}

// ============================================================
// 7. SSR safety — TrackingPixel uses useSearchParams which requires Suspense.
// ============================================================
async function suspenseBoundary() {
  const layout = await read("app/layout.tsx");
  if (!/<Suspense[\s\S]*?TrackingPixel/.test(layout)) {
    found({
      severity: "P1",
      area: "suspense",
      msg: "TrackingPixel uses useSearchParams; missing Suspense boundary → CSR bailout entire tree.",
    });
  }
}

// ============================================================
// 8. ClientIdField wiring — both lead-creating forms must include it
// ============================================================
async function clientIdFormWiring() {
  // Either <ClientIdField/> in the form (concierge-studio pattern) or
  // localStorage cc_cid + body-include in the React submit handler (the-tile).
  const candidates = [
    "app/(public)/contact/page.tsx",
    "app/(public)/free-audit/page.tsx",
    "components/forms/ContactForm.tsx",
  ];
  let anyWired = false;
  for (const f of candidates) {
    try {
      const src = await read(f);
      if (/ClientIdField|cc_cid|"cc_cid"/.test(src)) anyWired = true;
    } catch {}
  }
  if (!anyWired) {
    found({ severity: "P1", area: "binding", msg: `No form wires cc_cid; submitted leads will have no session bind.` });
  }
}

// ============================================================
// 9. cc_cid arrives in /api/leads
// ============================================================
async function leadsBinding() {
  const route = await (async () => {
    for (const f of ["app/api/leads/route.ts", "app/api/contact/route.ts"]) {
      try { return await read(f); } catch {}
    }
    return "";
  })();
  if (!/cc_cid|bindSessionToLead/.test(route)) {
    found({ severity: "P0", area: "binding", msg: "/api/leads doesn't read cc_cid or call bindSessionToLead." });
  }
  if (!/(payload|parsed\.data|body|data)\.cc_cid/.test(route) && /cc_cid/.test(route)) {
    found({ severity: "P1", area: "binding", msg: "/api/leads references cc_cid but reads from somewhere unexpected." });
  }
}

// ============================================================
// 10. ReadValueOf payload from form vs JSON
// ============================================================
async function payloadShape() {
  const route = await (async () => {
    for (const f of ["app/api/leads/route.ts", "app/api/contact/route.ts"]) {
      try { return await read(f); } catch {}
    }
    return "";
  })();
  // formData() returns string|File for entries — we coerce; fine
  // JSON also returns object. Check we handle both for cc_cid.
  if (/payload = await req\.formData\(\)/.test(route) && /payload\.cc_cid/.test(route)) {
    // formData entries return FormDataEntryValue — string|File. Need cast.
    if (!/typeof payload\.cc_cid === "string"/.test(route)) {
      found({ severity: "P2", area: "binding", msg: "/api/leads reads payload.cc_cid without typeof guard for File case." });
    }
  }
}

// ============================================================
// 11. Admin nav — every new admin page must be in the nav layout
// ============================================================
async function navCoverage() {
  const layout = await (async () => {
    // concierge-studio: app/(admin)/layout.tsx; the-tile: app/admin/_components/Sidebar.tsx
    for (const f of ["app/(admin)/layout.tsx", "app/admin/_components/Sidebar.tsx"]) {
      try { return await read(f); } catch {}
    }
    return "";
  })();
  for (const slug of ["live", "analytics", "insights"]) {
    if (!new RegExp(`/admin/${slug}\\b`).test(layout)) {
      found({ severity: "P1", area: "nav", msg: `/admin/${slug} not linked in admin nav.` });
    }
  }
}

// ============================================================
// 12. Migration appended to deploy workflow
// ============================================================
async function deployWorkflow() {
  const wf = await read("../../.github/workflows/deploy.yml").catch(() => "");
  if (!/wrangler d1 migrations apply|db:migrate/.test(wf)) {
    found({ severity: "P0", area: "deploy", msg: "deploy.yml missing wrangler migrations apply." });
  }
}

// ============================================================
// 13. Live polling never debounces — open multiple tabs and we hammer.
// ============================================================
async function pollHygiene() {
  const dash = await read("components/admin/LiveDashboard.tsx");
  if (!/clearInterval|stopped/.test(dash)) {
    found({ severity: "P1", area: "live", msg: "LiveDashboard polling never cleans up." });
  }
}

// ============================================================
// 14. Dwell ms negative on first pageview is allowed; fine.
//     But if the prev_dwell_ms calc yields > 30min we cap to 30min.
//     Validate the cap in track.ts
// ============================================================
async function dwellCap() {
  const track = await read("lib/analytics/track.ts");
  if (!/Math\.min\(payload\.prev_dwell_ms, 30 \* 60 \* 1000\)/.test(track)) {
    found({ severity: "P2", area: "dwell", msg: "track.ts may not cap prev_dwell_ms at 30min." });
  }
}

// ============================================================
// 15. /api/admin/live + insights are auth-gated
// ============================================================
async function adminAuthGate() {
  for (const f of ["app/api/admin/live/route.ts", "app/api/admin/insights/route.ts", "app/api/admin/leads/[id]/tags/route.ts", "app/api/admin/leads/[id]/notes/route.ts"]) {
    const src = await read(f);
    if (!/await requireAdmin\(req\)/.test(src)) {
      found({ severity: "P0", area: "auth", msg: `${f} missing requireAdmin gate.` });
    }
  }
}

async function main() {
  await Promise.all([
    migrationCoverage(),
    trackContract(),
    phantomPageviewBug(),
    noAnswerCoverage(),
    botWrites(),
    rateLimit(),
    suspenseBoundary(),
    clientIdFormWiring(),
    leadsBinding(),
    payloadShape(),
    navCoverage(),
    deployWorkflow(),
    pollHygiene(),
    dwellCap(),
    adminAuthGate(),
  ]);

  if (out.length === 0) {
    console.log("OK — no findings.");
    process.exit(0);
  }
  console.log(`\nAUDIT FINDINGS (${out.length}):\n`);
  const order: Finding["severity"][] = ["P0", "P1", "P2", "info"];
  for (const sev of order) {
    const items = out.filter((f) => f.severity === sev);
    if (items.length === 0) continue;
    console.log(`\n[${sev}] ${items.length}\n`);
    for (const f of items) console.log(`  ${f.area.padEnd(18)} ${f.msg}`);
  }
  process.exit(out.some((f) => f.severity === "P0") ? 1 : 0);
}
main();
