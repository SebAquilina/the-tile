# Admin panel spec — the-tile

Build-specific application of `references/13-admin-panel-sop.md` (in the v2 skill) to the-tile.

> ⚠ **No paid action — Stripe live mode toggle, paid plan upgrades, broadcast emails over Resend's free quota, domain renewals, Sentry/Plausible paid tier, Cloudflare paid plan upgrades — is taken from the admin without an explicit two-step confirmation: confirm intent, then type cost amount to authorize. Server-enforced, not just UX. Cowork enforces the same rule. You cannot bypass by switching surfaces.**

---

## Status today vs target state

The-tile already ships an admin at `/admin` with 4 of the 11 v2 sections. This spec lays out exactly what's done, what's partially there, and what Claude Code needs to build to reach v2 parity.

| # | v2 section | Status today | Build effort to reach v2 |
|---|---|---|---|
| 1 | Home / Dashboard | Stub at `/admin` (page.tsx exists, content placeholder) | **Medium** — wire KPIs (visitors, conversations, leads, agent cost), live activity feed, quick actions |
| 2 | Orders | N/A — not e-commerce | Skip |
| 3 | Products | ✅ Functional list + editor at `/admin/products` and `/admin/products/[id]` | **Small** — extend to support drafts, version history, "where this is used" panel, image pipeline (R2), CSV import/export, bulk-edit |
| 4 | Customers / Leads | ✅ Functional inbox at `/admin/leads` | **Small** — add lead-stage workflow (New → Contacted → Won/Lost), segments, CSV export, GDPR delete |
| 5 | Conversations | ❌ Missing entirely | **Medium** — new section: store agent dialogs to D1 (currently they're not persisted), build list + detail views, flagging UI, KPIs panel, PII redaction |
| 6 | Marketing | ❌ Missing entirely | **Medium** — new section: discount codes (UI + API), promo banner editor, broadcast email composer (gated by paid-action confirm above Resend free tier) |
| 7 | Content | ❌ Partially — pages exist as React components, not editable from admin | **Large** — convert page content from hard-coded JSX to DB-backed records; build rich-text editor (TipTap or Lexical); navigation drag-drop builder; FAQ editor (auto-feeds agent KB); journal editor with scheduled publishing |
| 8 | Theme | ❌ Missing entirely | **Large** — Shopify-style customizer: color picker with presets, font picker (Google Fonts dropdown + 4 named pairings), font-size slider, logo uploader (R2), spacing density, motion intensity, border radius, sections drag-drop home page builder, custom CSS (advanced toggle), live preview iframe with postMessage |
| 9 | AI Agent | ❌ Missing entirely (settings live in code) | **Large** — persona settings, system prompt visual editor, KB preview/regenerate, test playground, conversation log (depends on section 5), quick-reply chip editor, fallback behaviour, cost cap |
| 10 | Analytics | ❌ Stub at `lib/analytics.ts`; no admin section | **Medium** — wire Plausible (free tier covers, paid is a confirm) for page views + events; build dashboard (real-time, funnel, sources, geo, devices) |
| 11 | Settings | ❌ Missing entirely | **Medium** — general site settings, integrations (Resend / Sentry / Plausible / Slack with status indicators), users/team (multi-user roles — currently single-user basic auth), SEO defaults, cookies & GDPR, billing/usage, backup/export |

**Total effort:** roughly 4–8 sessions of Claude Code, depending on parallelism and how aggressively you simplify.

---

## Architecture changes required

The current admin is **simple** by v2 standards:
- Single-user basic auth
- Direct DB writes (no draft/publish state machine)
- No version history
- No live preview
- Content is hard-coded in React components
- Settings are env vars

To reach v2:

### 1. Auth upgrade
- Today: HTTP Basic Auth with `ADMIN_USER` / `ADMIN_PASSWORD` env vars (single user, BUILD_TIME-inlined).
- Target: session-based auth, multi-user, role-based (Owner / Admin / Editor / Viewer), CSRF tokens, activity log.
- Migration: keep basic auth as a fallback until session auth ships; once it does, basic auth is removed.

### 2. Draft / published state
- Add `draft` and `published` JSON columns to every editable record (products, pages, theme, agent settings, etc.).
- Add `_revisions` table for version history.
- Add publish endpoint that copies `draft` → `published` and triggers regen.
- Live site reads `published`; staging reads `draft`.

### 3. Content as data (not JSX)
- Today: `apps/web/app/(public)/about/page.tsx` has hard-coded copy.
- Target: `pages` table with `slug`, `draft`, `published` JSON; the page React component reads from DB at request time.
- Migration: extract copy from each public page → seed into `pages` table → update components to read from DB → preserve current rendering.

### 4. Theme as data
- Today: theme tokens in `apps/web/app/tokens.css` and `tailwind.config.ts`.
- Target: `theme_settings` table (single row, JSON blob); admin writes here; build-time script generates `tokens.css` from DB at build OR runtime CSS variables read from DB binding.
- Decision: **runtime via CF Pages bindings is preferred** — avoids the BUILD_TIME-inlining gotcha that bit ADMIN_USER.

### 5. Image pipeline
- Today: images in `apps/web/public/` (committed to git).
- Target: R2 bucket for user-uploaded images; Cloudflare Images for resize variants; admin uploader integrates with R2.
- The `populate-images.ts` script today imports a fixed set; the admin uploader runs the same pipeline on demand.

### 6. KB regeneration
- Today: `scripts/build-agent-context.ts` runs at build via `sync-kb.yml`.
- Target: also runs on-demand via admin's "Regenerate KB" button → API → script → commits to repo or directly updates the runtime KB binding.

### 7. Live preview iframe
- Today: no live preview.
- Target: `staging.the-tile.com?draftId=<id>` reads from drafts; admin embeds it as an iframe with postMessage hot-updates for theme changes.

---

## Per-section spec sized to the-tile

For each section, the implementation agent should follow `references/13-admin-panel-sop.md` (the universal SOP) plus these the-tile-specific notes:

### 3.1 Home

**KPI cards:**
- Today's visitors (from Plausible if wired, else from a custom event counter in D1)
- Today's conversations + completion rate
- Open contact-form leads (from `leads` table)
- Today's Gemini cost (from a daily aggregated `events` row)
- Top brand by conversation mentions

**Recent activity timeline:** from `_revisions` table — shows every admin action across all users in the last 24h.

### 3.3 Products

The-tile's products are **tiles**, with attributes specific to the catalog: dimensions, finish (matte / polished / etched), effect (terrazzo / cement / etc.), brand, vendor, price, availability, image gallery, related tiles, jsonld schema.

**Existing schema in `db/schema.ts`** likely already covers most of this. The admin extension:
- Add the variants concept (size variants of the same tile).
- Add the collections concept (tiles grouped by effect or theme — this exists in the public site as `/collections/[effect]/[slug]` so the table presumably exists).
- Add the "where this is used" panel: show which collections, which journal entries, and which agent conversations mention this tile.

### 3.4 Leads / Customers

**Today's `leads` table** stores contact-form submissions. Extend:
- Add `agent_captured` boolean for leads from agent conversations (when the agent collects email/phone).
- Add `stage` enum: New / Contacted / Qualified / Won / Lost.
- Add `notes` array.
- Add `tags` array.
- Add segment views: "leads from agent in last 7d", "high-value brands inquiries", etc.

### 3.5 Conversations *(new — biggest data-model change)*

**Today: agent conversations are not persisted.** `/api/agent/chat` streams a Gemini response back to the user; the dialog is not stored. To build this section:

- New `conversations` table: id, ip_hash, started_at, ended_at, message_count, outcome (left / lead / contact / unknown), language.
- New `conversation_turns` table: id, conversation_id, role (user / agent), content, timestamp, tokens_in, tokens_out.
- New `conversation_flags` table: id, conversation_id, turn_id, user_id (admin who flagged), reason, created_at.
- Update `/api/agent/chat` to write to these tables.
- Privacy: PII auto-redaction on display (emails, phone numbers, addresses).

### 3.7 Content

**Pages migration:** every `apps/web/app/(public)/<page>/page.tsx` that contains static copy becomes a thin component that reads from `pages` WHERE slug = '<page>' AND state = 'published'. Initial seed extracts existing copy.

**Journal:** likely already DB-backed; admin needs UI to create / edit / schedule.

**Navigation:** today probably hard-coded in `Header.tsx` and `Footer.tsx`. Migrate to `nav_menus` table; render from DB.

**FAQ:** add `faq_items` table; auto-feeds the agent's KB (regenerate on save).

### 3.8 Theme

The current `tokens.css` defines the design system tokens. Theme editor needs:
- Read tokens from DB instead of CSS file.
- A live-preview iframe pointing at staging.
- Color picker + accessibility checker (Tailwind contrast helpers).
- Font picker — the-tile likely uses 1–2 specific fonts; the customizer can pick from a curated list of similar editorial fonts.
- Sections drag-drop is most useful for the home page; tiles, product pages, journal pages have fixed layouts.

### 3.9 AI Agent

- Persona: the-tile's agent is currently anonymous; give it a name (e.g. "Tile Concierge") via persona settings.
- System prompt: today in `docs/spec/the-tile/07-agent-system-prompt.md`. Migrate to `agent_settings` table; the runtime reads from DB.
- KB: `docs/spec/the-tile/06-site-knowledge.md` is generated by the build script. Admin "Regenerate" button triggers it on-demand.
- Test playground: hits `/api/admin/agent/test` which calls Gemini with the draft prompt.
- Cost cap: a setting that the agent proxy reads on every request; if today's spend exceeds, return "we're at capacity" instead of calling Gemini.

### 3.11 Settings

- General: site name, tagline, contact email, business address (used by structured data in `lib/jsonld.ts`).
- Integrations: Resend, Sentry, (Plausible if wired), Cloudflare. Each shows status + configure button.
- Users / Team: invite by email (Resend); roles enforced via session cookie + middleware.
- SEO: default meta templates, robots.txt editor, sitemap (already auto-generated by `app/sitemap.ts`).
- Cookies & GDPR: existing `CookieConsent` component; admin toggles categories.
- Billing & usage: dashboards from CF / Resend / Sentry APIs.
- Backup: "Export everything" → ZIP of D1 dump + R2 contents + theme settings JSON.

---

## Test gates extension

The `tests/launch-readiness.sh` script (in this retrofit) already wires Gates 7–10 into the runner. They become applicable as the admin sections ship:

- **Gate 7** — admin functional E2E (Playwright) — adds tests under `apps/web/tests/e2e/admin/` per section.
- **Gate 8** — admin/Cowork parity tests — under `apps/web/tests/parity/`. Needs Cowork plugin skill backends to exist.
- **Gate 9** — admin → live integration. Adds a CI step that:
  - Edits via admin → publishes → curls live site → asserts new content visible.
  - Includes the BUILD_TIME admin-creds rotation test that v1 missed.
- **Gate 10** — admin permissions & security. Server-enforced no-purchase rule test.

---

## ⚠ The no-purchase rule inside this build's admin

Specific paid actions in the-tile's admin that need two-step confirmation:

| Action | Cost | Where |
|---|---|---|
| Toggle Resend to Pro tier | $20/mo | Settings → Integrations → Resend |
| Switch broadcast email to >100/day | costs above free tier | Marketing → Broadcast → Send |
| Upgrade Sentry to paid | $26/mo+ | Settings → Integrations → Sentry |
| Add Plausible at paid tier | $9/mo+ | Settings → Integrations → Plausible |
| Upgrade CF Workers to paid plan | $5/mo | Settings → Hosting (rare; only if traffic >100k/day) |
| Register a new domain | varies | Settings → Domain |
| Raise the agent cost cap | varies (not a direct charge but allows higher Gemini spend) | AI Agent → Cost cap |

Every one of these has a server-enforced authorization check. The mutation API rejects without the per-action token, even if the UX is bypassed.

---

## Definition of Done — admin is v2-complete when

- All 11 sections functional (10 if e-commerce stays out).
- Gate 7 green (admin E2E coverage).
- Gate 8 green (admin/Cowork parity for every Cowork skill in `cowork-plugin/`).
- Gate 9 green (admin → live integration covers all the propagation paths).
- Gate 10 green (auth, CSRF, role enforcement, server-enforced no-purchase rule).
- Live preview iframe updates in <500ms 95th percentile.
- WCAG AA on all admin pages.
- Default settings ship populated; first login lands the user on a working admin.
- 60-second onboarding tour runs on first login.
- Cowork plugin in `cowork-plugin/` matches admin capability one-for-one.
- BUILD_LOG.md records every default decision taken during the build.
- The no-purchase rule is enforced server-side, with a unit test proving a paid mutation lacking the authorization token is rejected.

When all twelve are true, the-tile's admin is v2-complete.
