# Claude Code prompt — execute the Shopify-feature-parity admin build

Open Claude Code in the the-tile repo and paste the following prompt.

```
You are picking up the-tile build to implement the Shopify-feature-parity admin per the spec.

CONTEXT YOU MUST READ FIRST:
1. docs/spec/the-tile/15-admin-panel-spec.md (the 11-section admin spec)
2. docs/spec/the-tile/16-shopify-feature-parity.md (comprehensive Shopify feature inventory + tier mapping)
3. docs/spec/the-tile/BLUEPRINT.md (overall build context)

CURRENT STATE:
- Public site is live at https://the-tile-web.pages.dev with all 60 products + 12 categories.
- Admin is at /admin — gated by Basic Auth (user:password). Currently 4 sections shipped:
  * /admin (dashboard placeholder)
  * /admin/leads
  * /admin/products + /admin/products/[id]
  * /admin/reviews
- D1 schema is in apps/web/db/schema.ts with current tables: products, brands, categories, leads.
- 89 product images self-hosted at apps/web/public/images/products/<id>/<n>.<ext>.
- Stack: Next.js 14 app router, edge runtime everywhere, @cloudflare/next-on-pages adapter, deploy via cloudflare/wrangler-action@v3.
- Brand extraction: docs/spec/the-tile/brand.json + apps/web/public/brand/the-tile-logo.png exist.

WHAT YOU'RE BUILDING (in this order, each is one PHASE_DONE checkpoint):

PHASE 1 — Foundation (~1 session)
- Add session-based auth alongside the existing Basic Auth (don't break Basic Auth — both work during transition)
- Add roles enum: owner / admin / editor / viewer
- Add CSRF tokens on every POST/PATCH/DELETE
- Add `_revisions` table for version history
- Add `draft` + `published` JSON columns to: products, pages (new), theme_settings (new), agent_settings (new)
- Add publish API: POST /api/admin/<resource>/<id>/publish copies draft→published, regen artifacts
- Migrate ADMIN_USER/ADMIN_PASSWORD from BUILD_TIME-inlined env vars to runtime CF Pages bindings (so rotation doesn't need rebuild — closes the v1 build's BUILD_TIME bug)

PHASE 2 — Products full editor (~1 session)
- Add product (full editor with image upload via R2)
- Variants matrix UI
- Bulk edit (multi-select → bulk price/status/tag/inStock toggle)
- CSV import (accept Shopify product CSV format) + CSV export
- "Where this is used" panel (dependencies on collections, journal references, agent KB mentions)

PHASE 3 — Theme editor (~1 session)
- Migrate apps/web/app/tokens.css to runtime DB read (theme_settings table)
- Build /admin/theme with:
  * Color picker (with palette presets + AA contrast checker overlay)
  * Font picker (curated Google Fonts dropdown + 4 named pairings: Editorial / Modern / Tech / Playful)
  * Logo uploader (R2)
  * Spacing density / motion intensity / border radius sliders
  * Sections drag-drop home page builder (hero / featured products / image+text / multi-column / FAQ / testimonials / newsletter / logo bar)
  * Custom CSS (advanced toggle)
- Live preview iframe (staging.the-tile.com?draftId=...) with desktop/tablet/mobile toggle + postMessage hot-updates

PHASE 4 — Content editor (~1 session)
- Migrate apps/web/app/(public)/{about,contact,showroom,etc}/page.tsx content from JSX to DB-backed (pages table)
- Build /admin/content/pages with rich text editor (TipTap or Lexical)
- Build /admin/content/nav with drag-drop tree builder
- Build /admin/content/faq with Q&A editor (auto-feeds agent KB on save)
- Build /admin/content/policies (privacy / terms / cookies — auto-template + edit)

PHASE 5 — AI Agent admin (~1 session)
- Migrate apps/web/scripts/build-agent-context.ts logic to be admin-triggerable
- Build /admin/agent with:
  * Persona settings (name, tone slider, language, pronouns)
  * System prompt visual editor (sectioned: identity / scope / tone / refusal / fallback)
  * Test playground (POST /api/admin/agent/test → live Gemini call → response + token cost)
  * KB preview (read-only docs/spec/the-tile/06-site-knowledge.md)
  * Regenerate KB button (triggers build-agent-context.ts on demand)
  * Conversation log (persist agent dialogs to D1 + flag bad responses)
  * Fallback behaviour config
  * Cost cap setting (hard ceiling — agent goes silent past cap; raising = paid-action confirm)

PHASE 6 — Marketing + Settings (~1 session)
- Build /admin/marketing (discount codes, promo banners, broadcast emails — broadcast above 100/day = paid-action confirm)
- Build /admin/settings:
  * General (site name, contact, address, time zone, logo, favicon)
  * Integrations (Resend / Sentry / Plausible / Slack — connection status + configure)
  * Users & permissions (invite by email, role enforcement, activity log)
  * SEO (meta defaults, robots.txt editor, sitemap status)
  * Cookies & GDPR
  * Billing & usage (track CF / Resend / Sentry / Gemini spend; upgrades paid-action confirm)
  * Backup & export (ZIP of D1 dump + R2 contents + theme JSON)

PHASE 7 — Cowork plugin backends + tests (~1 session)
- Implement each cowork-plugin/skills/<name> backend (currently stubs) → wire to /api/admin/* endpoints
- Add Gate 7 (admin functional E2E) tests under apps/web/tests/e2e/admin/
- Add Gate 8 (admin/Cowork parity) tests
- Add Gate 9 (admin → live integration) tests
- Verify Gate 10 (admin security) including server-enforced no-purchase rule

HARD RULES (non-negotiable):
1. No purchase, transfer, plan upgrade, paid sign-up, or money movement without explicit per-action confirmation. Server-enforced: every paid-action API endpoint REJECTS without the per-action authorization token even if UX is bypassed. Stripe stays test-mode unless explicitly approved per action.
2. Every env var you read in code: annotate BUILD_TIME or RUNTIME in 09-deploy-plan.md secrets table.
3. Every new workflow file passes actionlint before commit.
4. Every section ships with at least one E2E test BEFORE the next section starts.
5. After each PHASE_DONE: write a summary to BUILD_LOG.md, run the relevant test gate, ping me with PHASE_DONE: <phase-name>.

DEFAULT-DECISION POLICY:
- For every choice the spec lists as a default, take it. Log to BUILD_LOG.md.
- Where spec is silent, pick the answer that best matches the Charter and the existing site's tone. Log it.
- ESCALATE only for: (a) any paid action, (b) destructive ops, (c) decisions explicitly marked OWNER_DECIDES, (d) gates failing 3+ times on the same fix.
- For everything else: decide, log, ship.

START WITH PHASE 1. Report PHASE_DONE: foundation when complete.
```
