# Backend Tasks

**For**: implementation agent
**References**: `04-backend-spec.md`, `05-agent-spec.md §4-7`, `08-product-schema.json`, `09-deploy-plan.md`

---

## Setup (0.5 day)

- [ ] **B-001** Install Drizzle: `drizzle-orm`, `drizzle-kit`, `@cloudflare/d1`
- [ ] **B-002** Create `apps/web/db/schema.ts` with Drizzle definitions for `products`, `categories`, `brands`, `leads`, `agent_sessions` per `04-backend-spec.md §2`
- [ ] **B-003** Configure `drizzle.config.ts` to target D1
- [ ] **B-004** Create D1 databases `the-tile-staging` and `the-tile-prod` via `wrangler d1 create`
- [ ] **B-005** Write initial migration (`0000_init.sql`) and apply to staging

## Seed sync (0.5 day)

- [ ] **B-006** `scripts/validate-seed.ts` — Zod-validates all seed JSON files against `08-product-schema.json`, fails CI if broken
- [ ] **B-007** `scripts/sync-seed.ts` — reads seed JSON, truncates + inserts into D1 via Drizzle
- [ ] **B-008** Run seed sync on staging, verify row counts match seed counts

## API routes (2-3 days)

- [ ] **B-009** `app/api/products/route.ts` — GET with filters, faceted counts, edge-cached 5min
- [ ] **B-010** `app/api/products/[id]/route.ts` — GET single product with related
- [ ] **B-011** `app/api/contact/route.ts` — POST lead, Zod-validates, Turnstile-verifies, rate-limits, inserts to D1, triggers Resend email, returns leadId
- [ ] **B-012** `app/api/health/route.ts` — GET, returns `{ok, version, time}`
- [ ] **B-013** `app/api/save-list/sync/route.ts` — stub for Phase 2, schema-ready

## Agent proxy (2 days)

- [ ] **B-014** `scripts/build-agent-context.ts` — reads `07-agent-system-prompt.md` code block + `06-site-knowledge.md`, writes to `apps/web/lib/agent-system-prompt.ts` as exported constant
- [ ] **B-015** `app/api/agent/chat/route.ts` — Edge runtime, streams Gemini responses, parses + validates input
- [ ] **B-016** Rate limiting: IP hash (30/min, 200/hr), session (500/day) — in-memory cache + D1 fallback
- [ ] **B-017** Turnstile verification on first message per session, store session created in D1
- [ ] **B-018** Token-cap handling: if `MONTHLY_TOKEN_CAP` exceeded, return polite-fallback message, don't hit Gemini
- [ ] **B-019** Telemetry: increment session counters, emit Plausible events (server-side via API), log latency

## Integrations (1-2 days)

- [ ] **B-020** Resend client + email template (HTML + text) per `04-backend-spec.md §6`
- [ ] **B-021** Resend retry cron via CF Scheduled Worker — retries `email_status='failed'` leads every 15min, max 4 attempts
- [ ] **B-022** Turnstile client wrapper — verifies token via CF API, returns boolean
- [ ] **B-023** Plausible server-side event helper
- [ ] **B-024** Sentry SDK config for API routes (separate from frontend SDK)

## Security + privacy (1 day)

- [ ] **B-025** Middleware in `apps/web/middleware.ts` — CSP, HSTS, X-Frame-Options, Referrer-Policy
- [ ] **B-026** CSRF protection — Next.js 14 handles this for Server Actions; for API routes, check Origin header against allowed list
- [ ] **B-027** PII scrubbing: Sentry `beforeSend` strips email/phone from error payloads
- [ ] **B-028** Cookie consent backend — if user hasn't consented, don't emit Plausible events server-side
- [ ] **B-029** Lead data export (CSV) endpoint under `/api/admin/leads` — phase 2 but scaffold access-control middleware now

## Testing (1 day, can parallel)

- [ ] **B-030** Vitest tests for schema validation, rate-limit logic, Resend template rendering
- [ ] **B-031** Integration test for `/api/contact` end-to-end (Zod → Turnstile → D1 → Resend) using test doubles
- [ ] **B-032** Integration test for `/api/agent/chat` with mocked Gemini — verifies streaming, action trailer parsing, rate limits

## Observability (0.5 day)

- [ ] **B-033** `/api/health` wired to uptime monitor
- [ ] **B-034** CF Logs forwarded to destination of choice (optional)
- [ ] **B-035** Alert rules in Sentry + uptime dashboard configured per `09-deploy-plan.md §7`

---

**Total estimate**: 9-12 working days (1.8-2.5 weeks) for a senior backend dev.
