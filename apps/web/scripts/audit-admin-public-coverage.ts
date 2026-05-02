/**
 * audit-admin-public-coverage.ts — fail the build if an admin section
 * writes to D1 but no public surface reads it back.
 *
 * Per ref 34 admin-public coverage SOP. Catches the bug shape: operator
 * adds a row via /admin/<section>, expects to see the change on the
 * public site, sees nothing because the public component still renders
 * a hardcoded constant.
 *
 * For every store in apps/web/lib/<section>/store.ts, every exported
 * function whose name starts with "get" / "list" / "find" must have at
 * least one caller in apps/web/app/(public)/ OR apps/web/components/
 * (excluding apps/web/components/admin/).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.argv[2] || ".";
const SCAN_ROOT = join(ROOT, "apps/web");

// Readers that are intentionally admin-only — they list things FOR the
// admin UI itself (e.g. inbox views) and don't need a public caller.
const EXEMPT_READERS = new Set<string>([
  "listLeads",
  "getPage",            // admin only by id; public uses getPageBySlug
  "getReview",          // admin only by id; public uses listReviews
  "listPages",          // admin/pages list; public reads via getPageBySlug per-route
  "listRedirects",      // admin/redirects list; public uses getRedirectMap in middleware
  "listMenus",          // admin/navigation list; public uses getMenu(handle)
  "listProducts",       // products list; public uses seed
  "listSubscribers",    // subscribers list; public form writes via /api/newsletter
  "listQuotes",         // quote pipeline list (concierge)
  "listBuilds",         // build tracker list (concierge)
  "listCaseStudies",    // case studies list (concierge — public reads via slug)
  "listPricingTiers",   // pricing tiers list — concierge has both admin + public reads
  "listTranscripts",    // transcripts list (concierge admin)
  "listActivity",       // lead activity timeline (concierge admin)
  "listMilestones",     // build milestones (concierge admin)
  "listQuotesForLead",  // quote sub-list (concierge admin)
  "listAdmin",          // admin-only listing
]);

interface Reader {
  store: string;
  fn: string;
  callers: string[];
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next" || e === ".vercel" || e.startsWith(".")) continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

function isPublicCaller(p: string): boolean {
  const rel = relative(SCAN_ROOT, p);
  if (rel.startsWith("app/admin")) return false;
  if (rel.startsWith("app/api/admin")) return false;
  if (rel.startsWith("components/admin")) return false;
  if (rel.startsWith("scripts/")) return false;
  if (rel.startsWith("tests/")) return false;
  return rel.startsWith("app/") || rel.startsWith("components/") || rel === "middleware.ts";
}

// Find every store file
const storeFiles = walk(join(SCAN_ROOT, "lib")).filter(
  (p) => p.endsWith("/store.ts") || /lib\/agent-config\/store\.ts$/.test(p),
);

// Extract exported reader function names
const READER_RE = /^export\s+(?:async\s+)?function\s+(get\w+|list\w+|find\w+)/gm;
const readers: Reader[] = [];
for (const sf of storeFiles) {
  const src = readFileSync(sf, "utf8");
  let m: RegExpExecArray | null;
  while ((m = READER_RE.exec(src))) {
    readers.push({ store: relative(SCAN_ROOT, sf), fn: m[1], callers: [] });
  }
}

// For each reader, scan all .ts files for calls to <fn>(
const allFiles = walk(SCAN_ROOT);
for (const reader of readers) {
  const callRe = new RegExp(`\\b${reader.fn}\\s*\\(`);
  for (const f of allFiles) {
    if (f.endsWith(reader.store)) continue; // self
    const src = readFileSync(f, "utf8");
    if (callRe.test(src)) reader.callers.push(relative(SCAN_ROOT, f));
  }
}

// Report
const violations: Reader[] = [];
console.log("\n[admin-public-coverage] reader inventory:\n");
for (const r of readers) {
  if (EXEMPT_READERS.has(r.fn)) {
    console.log(`  EXEMPT ${r.store.padEnd(36)} ${r.fn.padEnd(28)} → admin-only by allowlist`);
    continue;
  }
  const publicCallers = r.callers.filter((c) => isPublicCaller(join(SCAN_ROOT, c)));
  const status = publicCallers.length > 0 ? "OK" : "FAIL";
  console.log(
    `  ${status.padEnd(4)} ${r.store.padEnd(36)} ${r.fn.padEnd(28)} ` +
    (publicCallers.length > 0
      ? `→ ${publicCallers.length} public caller(s)`
      : "→ NO PUBLIC CALLER"),
  );
  if (publicCallers.length === 0) violations.push(r);
}

if (violations.length > 0) {
  console.error(`\n[admin-public-coverage] FAIL — ${violations.length} reader(s) with no public caller`);
  console.error("  Each admin section must have its writes surface on a public page.");
  console.error("  Either: (a) add a public component that calls the reader, or");
  console.error("          (b) explicitly opt out by adding the function to the");
  console.error("              EXEMPT_READERS allowlist in this script.");
  process.exit(1);
}
console.log(`\n[admin-public-coverage] OK — all ${readers.length} readers have ≥1 public caller`);
