# Website guide — the-tile

This is the page-by-page guide to your site. Read it once cover-to-cover; come back to specific sections when you need them.

> ⚠ **No paid action — domain renewal, plan upgrade, paid SaaS sign-up, broadcast emails over Resend's free tier — is taken on your behalf without your explicit per-action confirmation. If anything proposes to spend money, type "halt".**

---

## Live URLs

| Environment | URL | Who can see it |
|---|---|---|
| Production | https://www.the-tile.com | The world |
| Production pages.dev mirror | https://the-tile-web.pages.dev | The world (same content) |
| Staging | https://staging.the-tile.com | Whoever has the URL |
| Latest preview (per deploy) | `https://<hash>.the-tile-web.pages.dev` | Whoever has the URL |
| Admin panel | https://www.the-tile.com/admin | You only — gated by basic auth |

**Repository:** https://github.com/SebAquilina/the-tile
**Hosting dashboard:** https://dash.cloudflare.com/cfd32b6623c3b1adce7345cdff737d14/pages/view/the-tile-web

---

## Section 1 — Public pages

### `/` — Home

**URL:** https://www.the-tile.com/
**Audience:** all visitors
**Purpose in one sentence:** introduce visitors to the artisan tile catalog and let the agent guide them to what they're looking for.

**What's on the page (top to bottom):**
1. **AI concierge greeting card** — "What kind of tile are you looking for?" — primary surface
2. Hero — large headline + brand mood imagery
3. Featured collections rail — by effect (terrazzo / cement / concrete / etc.)
4. Featured brands strip
5. About teaser
6. Latest journal entries
7. Reviews strip
8. Footer (full nav, contact, social, legal)

**What the agent does here:**
- Greets every new visitor with the question above
- Suggests 4 quick paths (chips: "Browse by effect", "Browse by brand", "Find what's in stock", "Talk to a human")
- Navigates to the right collection / brand / product if the user types a specific need
- If user dismisses, the visual site below is fully browsable

**What you can change without code (via Cowork):**
- Hero headline + subhead (`edit-page` skill, target `home`)
- Featured collections (which ones, count)
- Featured brands
- Greeting copy + chip CTAs

**What needs a developer to change (Claude Code):**
- The greeting flow logic
- New page sections / new layout

### `/collections` — Browse collections

**URL:** https://www.the-tile.com/collections
**What's here:** filterable grid of every collection, faceted by effect. Filter chips persist in the URL so it's shareable.
**Edit content via:** Cowork `update-collections` (TBD — admin needs Theme + Content sections to ship this fully).

### `/collections/[effect]` — Collections by effect

URL pattern: `/collections/terrazzo`, `/collections/cement`, etc.
**What's here:** all collections that match the effect, with imagery and short copy.

### `/collections/[effect]/[slug]` — Single collection (e.g. `/collections/terrazzo/calacatta-amber`)

**URL pattern:** `/collections/[effect]/[slug]`
**What's here:** detail of one collection — hero imagery, specs, related tiles, save-list button.

### `/brands` — Brands directory

**URL:** https://www.the-tile.com/brands
**What's here:** every brand the-tile carries, with logo + short description + link to brand detail.

### `/brands/[slug]` — Single brand

**URL pattern:** `/brands/[slug]`
**What's here:** brand profile with story, signature collections, reviews.

### `/journal` — Editorial / blog index

**URL:** https://www.the-tile.com/journal
**What's here:** journal posts, paginated, filterable.

### `/journal/[slug]` — Single journal entry

**URL pattern:** `/journal/[slug]`
**What's here:** a long-form editorial post with imagery, related collections, RSS-discoverable.

### `/about` — About

**URL:** https://www.the-tile.com/about
**What's here:** story of the-tile, team, philosophy, partner brands.

### `/contact` — Contact

**URL:** https://www.the-tile.com/contact
**What's here:** contact form (sends via Resend), business hours, address, map link.

### `/showroom` — Visit the showroom

**URL:** https://www.the-tile.com/showroom
**What's here:** address, hours, parking, "what to expect" copy, booking nudge.

### `/save-list` — User's saved tiles

**URL:** https://www.the-tile.com/save-list
**What's here:** a personal list (stored in localStorage) of tiles the visitor has flagged for follow-up.

### `/reviews` — Reviews

**URL:** https://www.the-tile.com/reviews
**What's here:** all reviews, filterable, with ratings.

### `/privacy`, `/terms`, `/cookies`

**Standard legal pages.** Editable via Cowork `edit-page`.

### `/api/health`, `/api/agent/chat`, `/api/contact`

**API endpoints.** Health is public. Agent chat and contact are public POST. Admin APIs are gated.

---

## Section 2 — The AI concierge

The agent uses Gemini Flash-Lite, grounded on `docs/spec/the-tile/06-site-knowledge.md`, regenerated automatically when products / brands / journal / FAQ change.

**Where it appears:**
- Home page: full-card greeting
- Every other page: small floating "ask" button, bottom-right
- Mobile: bottom sheet

**What it knows:**
- Full collection catalog (every tile, every effect, every brand)
- The journal archive (so it can answer "do you have a piece on encaustic care?")
- Reviews (so it can quote what other customers said)
- Contact details, showroom hours
- The site's structure (where things are)

**What it does NOT know:**
- Anything not in the knowledge file. If a visitor asks something off-scope, it says "I don't know — let me get someone." It does not invent.

**Cost:**
- Gemini Flash-Lite: $0.25 / M input tokens, $1.50 / M output. For a small site running 500–1,000 conversations/month this costs roughly $1–3/month.
- Free tier: none. Budget $5/month and you're covered.

**How to update what it says:**
- Add a new product → Cowork `add-product` → KB regenerates → agent learns about it.
- Change tone → Cowork `tune-agent` → edit system prompt → redeploy.
- Add an FAQ → currently requires manual edit of `apps/web/scripts/build-agent-context.ts` until the v2 admin panel ships.

**Cost cap (when v2 admin panel lands):** today the agent has no cost cap; if traffic spikes, costs rise. The `15-admin-panel-spec.md` cost cap setting is a Claude Code follow-up.

---

## Section 3 — Admin panel (the Shopify-style control centre)

**URL:** https://www.the-tile.com/admin
**Credentials:** stored in your password manager — never committed, never in chat. The current creds are `ADMIN_USER` / `ADMIN_PASSWORD` env vars in Cloudflare Pages (Production env).

### What's shipped today (4 of 11 v2 sections)

1. **Dashboard** (`/admin`) — overview placeholder
2. **Leads** (`/admin/leads`) — contact-form submissions inbox; mark-read flow
3. **Products** (`/admin/products`, `/admin/products/[id]`) — list and editor for catalog items, with persistence indicator and publish bar that commits via `/api/admin/publish`
4. **Reviews** (`/admin/reviews`) — review moderation list

### What's NOT shipped yet (per `15-admin-panel-spec.md`, requires Claude Code build)

5. **Conversations** — agent dialog log, flag bad responses, KPIs
6. **Marketing** — discount codes, promo banners, broadcast emails
7. **Content** — pages editor (rich text, live preview), journal editor, navigation builder, FAQ editor
8. **Theme** — colors, fonts, font sizes, logo, motion, sections drag-drop, custom CSS, live preview iframe
9. **AI Agent** — persona, system prompt visual editor, KB preview/regenerate, test playground, conversation log, fallback behavior, cost cap
10. **Analytics** — page views, agent metrics, funnel, sources, real-time, custom events
11. **Settings** — domain, integrations, users/team, SEO, cookies, billing, backup/export

**Until the missing 7 sections ship, content/theme/agent edits go through Cowork or a developer.** Cowork handles most of it conversationally already.

### Security

- HTTP Basic Auth on `/admin/*` and `/api/admin/*` via `middleware.ts`.
- `ADMIN_USER` and `ADMIN_PASSWORD` are env vars in Cloudflare Pages.
- ⚠ **Rotating these requires a redeploy** — the middleware reads `process.env.X` at build time and inlines values. Cowork's `rotate-admin-password` skill handles env var update + redeploy together.
- No CSRF tokens yet — to add when v2 admin lands.
- No role-based access yet (single-user admin) — to add when v2 admin lands.
- Don't share `/admin` URL publicly. Security comes from the password.

### How to update via Cowork (alternative to admin UI)

| You say to Cowork | What it does |
|---|---|
| *"Add this product from products.xlsx"* | Updates `apps/web/lib/seed.ts` data, regenerates agent KB, opens a PR |
| *"Change the about-page hero to read X"* | Edits `apps/web/app/(public)/about/page.tsx`, opens a PR |
| *"Make the agent's tone warmer"* | Edits `docs/spec/the-tile/07-agent-system-prompt.md` and the runtime prompt source, opens a PR |
| *"Rotate the admin password"* | Updates CF env var + triggers redeploy + reports the new password (in a way that bypasses chat history) |
| *"Roll back the last deploy"* | Reverts the most recent deploy via `gh workflow run rollback` |
| *"View leads"* | Lists open contact-form submissions |

Both surfaces (admin UI + Cowork) hit the same backend. Same diffs. Today, Cowork is the fuller surface; once the v2 admin panel lands, parity is enforced by Gate 8 tests.

---

## Section 4 — Email, payments, and other integrations

### Email — Resend
**Plan:** Free tier (100/day, 3000/month).
**Where to manage:** https://resend.com/domains
**API key:** `RESEND_API_KEY` in Cloudflare Pages env (Secret type).
**To rotate:** generate new key on Resend → update env var → redeploy. Cowork's `rotate-secret` (TBD) will automate this.

### Payments — none
the-tile does not currently take payments through the website. Showroom visits / orders are handled offline.

### Error tracking — Sentry
**Plan:** Free tier (5k errors/month).
**API key:** `SENTRY_AUTH_TOKEN` in GitHub Actions (used for sourcemap upload during deploy). Currently set conditionally (the deploy.yml fix in this retrofit makes it actually fire when set).

### Analytics — TBD (Plausible recommended)
**Status:** not yet wired. `lib/analytics.ts` exists as a stub.

### Bot protection — Cloudflare Turnstile
**Status:** key exists in deploy plan but widget creation needs CF dashboard UI step (token lacks scope per Issue #2).

---

## Section 5 — Hosting cost breakdown

Realistic monthly running cost for the-tile **today** (no traffic surprises):

| Item | Tier | Cost |
|---|---|---|
| GitHub | Free unlimited repos | $0 |
| Cloudflare Pages | Free (500 builds/mo, unlimited bandwidth) | $0 |
| Cloudflare D1 | Free (5M reads/d, 100k writes/d, 5GB) | $0 |
| Cloudflare Workers (agent proxy) | Free (100k req/day) | $0 |
| Domain (the-tile.com) | Annual at registrar | ~$1.25/mo amortised |
| Gemini API for agent | Per-token | ~$1–3/mo |
| Resend (email) | Free tier | $0 |
| Sentry | Free tier | $0 |
| **Total** | | **~$3–5/mo** |

Costs only go up if:
- Traffic spikes 10×+ → Workers paid plan ($5/mo) — paid-action confirm.
- Email volume above Resend's free tier → Resend paid ($20/mo) — paid-action confirm.
- Errors above Sentry's 5k/mo → Sentry paid ($26/mo) — paid-action confirm.
- Plausible analytics added → $9/mo — paid-action confirm.

> ⚠ **Every paid tier upgrade is gated by per-action confirm. None happens without your explicit "yes."**

---

## Section 6 — How to update things via Cowork

Once the Cowork plugin skeleton from `cowork-plugin/` lands and is fleshed out (a Claude Code task), every admin operation has a conversational equivalent:

| Say to Cowork | Cowork skill |
|---|---|
| *"Add this product from products.xlsx"* | `add-product` |
| *"Edit this product's price"* | `update-product` |
| *"Change the about-page hero"* | `edit-page` |
| *"Make the agent warmer"* | `tune-agent` |
| *"Regenerate the agent's knowledge"* | `regenerate-kb` |
| *"View this week's leads"* | `view-leads` |
| *"Push the open changes live"* | `deploy-now` |
| *"Roll back the last deploy"* | `rollback` |
| *"Rotate the admin password"* | `rotate-admin-password` |
| *"Send a broadcast about the new collection"* | `broadcast-email` *(paid-action confirm above 100/day)* |

Every change goes through a PR (or a draft that you publish via the admin's PublishBar). You approve before anything goes live.

> ⚠ **Cowork still asks per-paid-action.** Switching Resend to live tier, upgrading Cloudflare Workers, registering a new domain — each is a separate yes.

---

## Section 7 — Limits & known gotchas

- **Admin auth requires redeploy on rotation.** `process.env.ADMIN_USER`/`ADMIN_PASSWORD` are read by Edge middleware at build time. CF dashboard updates do not propagate without a rebuild. (Cowork's `rotate-admin-password` skill handles this for you.)
- **Custom domain SSL takes 1–24 hours to fully propagate the first time.** After that, instant.
- **Agent cost is uncapped today.** Until the cost cap setting from `15-admin-panel-spec.md` ships, watch CF analytics and Gemini's dashboard for spikes.
- **Lighthouse perf scores vary 5–10 points between runs.** The CI gate is the source of truth, not a one-off run.
- **Cowork plugin is skeleton today** — full per-skill backends require the Claude Code follow-up build. Conversational edits work for products/content via the existing API; theme/agent/analytics edits need the v2 admin panel.

---

## Section 8 — When you take over (or hand off to a buying client)

If this site is being handed to a client who bought it, follow `14-client-handoff-runbook.md` step-by-step. Domain transfer, repo transfer, CF migration, key re-issue, plugin install on their side, recurring-cost ownership flip, removal of operator access.

> ⚠ **Final restatement: every paid action — domain transfer fees, plan upgrades, paid-tier sign-ups during handoff — is on the client's card. You never enter their card details. They confirm each one.**
