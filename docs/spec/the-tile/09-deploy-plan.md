# 09 — Deploy Plan

**Project**: The Tile · agent-first rebuild

This is the full deployment + operations spec. An implementation agent with GitHub + Cloudflare access should be able to stand up staging and prod following these steps end to end.

---

## 1. Hosting topology

```
                        ┌────────────────────────┐
                        │   the-tile.com (apex)  │
                        │ www.the-tile.com (CNAME)│
                        └──────────┬─────────────┘
                                   │
                                   ▼
                ┌──────────────────────────────────┐
                │   Cloudflare DNS + Proxy/Turnstile │
                └──────────────────┬──────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
  ┌────────────┐          ┌─────────────────┐         ┌──────────────┐
  │ CF Pages   │          │ Pages Functions │         │ Worker (opt.)│
  │ (Next.js)  │          │ /api/*          │         │ agent-proxy  │
  │ static +   │          │ Edge runtime    │         │ (if split    │
  │ ISR        │          │                 │         │ out later)   │
  └──────┬─────┘          └────────┬────────┘         └──────┬───────┘
         │                         │                         │
         │                         ▼                         │
         │                ┌──────────────┐                   │
         │                │  D1 (SQLite) │◄──────────────────┘
         │                └──────────────┘
         │                         │
         ▼                         ▼
   ┌──────────┐         ┌───────────────────┐
   │ R2 (opt) │         │ External:          │
   │ images   │         │  • Gemini API       │
   │ bucket   │         │  • Resend           │
   └──────────┘         │  • Turnstile verify │
                        │  • Plausible        │
                        │  • Sentry           │
                        └───────────────────┘
```

All services: Cloudflare free tier is sufficient for expected Malta tile-showroom traffic. D1 free tier = 5GB + 5M reads/day + 100K writes/day — we'll use <1% of that.

---

## 2. Repo + branches

**Repo**: `github.com/the-tile/website` (private; The Tile owns it)
**Default branch**: `main` → deploys to **production** (`the-tile.com`)
**Staging branch**: `staging` → deploys to **staging** (`staging.the-tile.com`)
**Feature branches**: PR preview deploys automatically via CF Pages, URLs of form `[hash].the-tile.pages.dev`

PRs must be green (CI) and reviewed before merge. `main` is protected; direct push disabled.

---

## 3. Domain + DNS

| Record | Type | Target | Notes |
|---|---|---|---|
| `the-tile.com` | A / AAAA | CF Pages (auto) | Proxied (orange cloud) |
| `www.the-tile.com` | CNAME | `the-tile.com` | Proxied; 301 to apex in Pages |
| `staging.the-tile.com` | CNAME | `staging.the-tile.pages.dev` | Proxied |
| `*.the-tile.com` | CNAME | `the-tile.pages.dev` | For preview deploys |

**Cutover plan** from current Weebly:
1. Build new site, get it fully working on `staging.the-tile.com` under a sub.
2. Final review with The Tile, sign-off.
3. Update apex DNS records to point at CF Pages (5-min TTL day of cutover).
4. Monitor 301 redirects for the first 24h — confirm no unintended 404s from the old sitemap.
5. After 30 days of clean operation, remove the old Weebly publish.

---

## 4. Cloudflare project configuration

### CF Pages project

- **Project name**: `the-tile-web`
- **Production branch**: `main`
- **Build command**: `pnpm build`
- **Build output directory**: `apps/web/.next` (Next.js on CF Pages adapter handles this)
- **Framework preset**: **Next.js**
- **Node version**: 20.x (pinned via `.nvmrc`)
- **Environment variables** (prod + staging separately):
  - See `04-backend-spec.md §7` for full list
  - Each env var must be set in CF dashboard for both **Production** and **Preview** environments
  - Secrets (API keys) are encrypted; non-secret (`NEXT_PUBLIC_*`) are plain
- **Compatibility flags**: `nodejs_compat` enabled (needed for some Next.js internals on Pages)

### D1 database

- **Production DB**: `the-tile-prod`
- **Staging DB**: `the-tile-staging`
- **Bound** in `wrangler.toml` as `DB`:

```toml
# wrangler.toml (at repo root)
name = "the-tile"
compatibility_date = "2026-04-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "the-tile-prod"
database_id = "<replace-with-prod-db-id>"

# preview/staging overrides
[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "the-tile-staging"
database_id = "<replace-with-staging-db-id>"
```

Migrations run via `pnpm drizzle-kit migrate` or `wrangler d1 migrations apply the-tile-prod` — the GitHub Action runs this on every deploy (see §5).

### R2 (optional, Phase 2)

If supplier imagery is licensed and we self-host (rather than hotlinking from supplier CDNs), set up an R2 bucket `the-tile-images` with a CF Worker in front for on-the-fly resizing. Phase 1 can defer and use supplier URLs or locally-committed `public/images/`.

### Turnstile

- Create site in CF Turnstile dashboard, domain `the-tile.com` + `staging.the-tile.com`
- Get site key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Get secret key → `TURNSTILE_SECRET`

### Cache rules

- `/_next/static/*`, `/images/*`: Cache everything, 1 year, immutable
- `/api/*`: Bypass cache
- `/`, `/collections/*`: Cache for 5 min edge, revalidate via ISR
- Everything else: default

---

## 5. CI/CD (GitHub Actions)

Three workflows:

### `.github/workflows/ci.yml` — run on every PR

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main, staging] }

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit
      - run: pnpm validate-seed     # zod-validates seed JSON files
      - run: pnpm build             # catches build errors early

  e2e:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
        env:
          # against a locally-built app with a mocked Gemini
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY_TEST }}
          TURNSTILE_SECRET: 1x0000000000000000000000000000000AA  # always-passes test key
```

### `.github/workflows/deploy.yml` — on push to main or staging

```yaml
name: Deploy
on:
  push: { branches: [main, staging] }

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      # Run D1 migrations for the target env
      - name: Apply D1 migrations
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            pnpm wrangler d1 migrations apply the-tile-prod --remote
          else
            pnpm wrangler d1 migrations apply the-tile-staging --remote
          fi

      # Sync product seed into D1 (see scripts/sync-products.ts)
      - name: Sync seed → D1
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: pnpm tsx scripts/sync-seed.ts ${{ github.ref_name }}

      # Deploy to CF Pages
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: the-tile-web
          directory: apps/web/.next
          branch: ${{ github.ref_name }}

      # Upload Sentry source maps (prod only)
      - name: Sentry release
        if: github.ref == 'refs/heads/main'
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: the-tile
          SENTRY_PROJECT: web
        with:
          environment: production
```

### `.github/workflows/sync-kb.yml` — regenerate agent grounding when seed changes

```yaml
name: Sync KB
on:
  push:
    branches: [main, staging]
    paths:
      - 'spec/the-tile/seed/**'
      - 'spec/the-tile/06-site-knowledge.md'
      - 'spec/the-tile/07-agent-system-prompt.md'

jobs:
  rebuild-kb:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm tsx scripts/build-agent-context.ts
      - name: Commit regenerated files
        run: |
          git config user.name "github-actions"
          git config user.email "bot@the-tile.com"
          git add apps/web/data/site-knowledge.md apps/web/lib/agent-system-prompt.ts
          git diff --quiet --cached || git commit -m "chore: regenerate agent context"
          git push
```

This way, editing the seed JSON automatically updates the agent's grounding without manual builds.

---

## 6. Secrets inventory (GitHub Actions secrets)

| Secret | Used by | How to rotate |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | deploy.yml, sync-kb.yml | CF dashboard → API Tokens → Edit. Scope: Pages (Edit), D1 (Edit), Workers (Edit) on the-tile account only. |
| `CLOUDFLARE_ACCOUNT_ID` | deploy.yml | CF dashboard (not a secret strictly, but stored alongside) |
| `GEMINI_API_KEY_TEST` | ci.yml (E2E) | Google AI Studio, separate key from prod |
| `GEMINI_API_KEY` | CF Pages env (Production + Preview) | Google AI Studio → Create Key. Set in CF dashboard, not GH. |
| `RESEND_API_KEY` | CF Pages env | Resend dashboard → API Keys → Create. |
| `TURNSTILE_SECRET` | CF Pages env | CF Turnstile site settings. |
| `SENTRY_AUTH_TOKEN` | deploy.yml (source-maps) | Sentry → Settings → Auth Tokens. |
| `IP_HASH_SALT` | CF Pages env | Randomly generated once, rotated only on incident. |

Rotation schedule:
- Every 90 days: Gemini API key, Resend key
- Every 180 days: CF API token
- On any incident: everything

Rotation doc at `docs/runbook/secrets-rotation.md`.

---

## 7. Observability + runbook

### Dashboards

- **CF Pages** — deploy history, edge request logs, geographic distribution
- **D1** — query analytics, table sizes
- **Sentry** — errors, performance, releases
- **Plausible** — page views, custom events (agent.opened, lead.submitted)
- **Uptime monitor** — status page

### Alerting

| Signal | Channel | Threshold |
|---|---|---|
| `/api/health` down | Email + Slack | 2 consecutive failures |
| Sentry error spike | Slack | > 5 errors / 5 min |
| Gemini token burn | Email digest | > 80% of MONTHLY_TOKEN_CAP in a week |
| Resend failure rate | Slack | > 3 failures in 15 min |
| Lighthouse regression | GitHub check | Any metric below budget |

### Runbook docs

Under `docs/runbook/`:

- `deploy-failure.md` — what to do when a deploy fails
- `d1-corruption.md` — recovery from a bad migration
- `gemini-outage.md` — fallback behaviour when Gemini is down (agent shows "having a moment — please browse or contact us")
- `resend-outage.md` — leads retry queue, manual export from D1
- `secrets-rotation.md` — step-by-step for each secret
- `cutover-from-weebly.md` — the one-time launch procedure
- `seed-update.md` — for The Tile's team: how to add a new tile (edit JSON, push, done)

---

## 8. Day-2 operations — for The Tile's team

After launch, the website should be operable by The Tile's team without touching code for 80% of use cases. Everything that's not "add a new tile collection" or "update a policy" requires a developer.

**Tasks The Tile can do themselves** (documented in `docs/team-handbook.md`):
- Add a new tile series: edit `seed/products.seed.json` (structured JSON, with examples), commit via GitHub web editor, site auto-rebuilds in ~3 min
- Mark a tile out of stock / restock: flip `inStock: true/false` on the same file
- Update a policy or about-page copy: edit Markdown files in `content/` directory, commit, auto-deploys
- Respond to lead emails: just reply from the shop inbox

**Tasks requiring a developer**:
- Add a new category (e.g. "Kitchen worktops" as a new effect)
- Change the design / add new page types
- Modify the agent system prompt (hand-off to dev; the dev edits `07-agent-system-prompt.md` and the build regenerates)
- Integrate a new 3rd-party (booking system, CRM, etc.)

**Phase 2**: a lightweight admin UI for non-technical product edits. Not Phase 1 — the GitHub-web-editor flow is functional and saves 2-3 weeks of build.

---

## 9. Cost estimate (monthly, steady state)

Assumptions: 2K unique visitors/month, 20% engage agent, ~6 turns avg, light lead volume.

| Service | Plan | Est. cost |
|---|---|---|
| Cloudflare Pages | Free tier | €0 |
| Cloudflare D1 | Free tier | €0 |
| Cloudflare Workers (if used) | Free tier | €0 |
| Cloudflare Turnstile | Free | €0 |
| Gemini API | Pay-as-you-go | €1-3 |
| Resend | Free (100/day) | €0 |
| Plausible | Starter (10K/mo) | €9 |
| Sentry | Developer (free) | €0 |
| Domain | renewal | €10 / year → €1/mo |
| **Total** | | **≈ €12-15/month** |

First month: slightly higher during cutover for monitoring overlap. 10× traffic scenario: still under €50/month.

---

## 10. Agent Teams build option (for the implementation phase)

If Seb chooses to orchestrate this build via Claude Managed Agents / Agent Teams (instead of solo Claude Code), the recipe:

- **Coordinator**: Claude Opus 4.7 — reads this spec directory, drafts the task graph, reviews PRs
- **Agents** (parallel, Sonnet 4.6 each):
  - `agent-design` — implements the design system from `01-design-system.md`
  - `agent-frontend` — implements components + pages from `03-frontend-spec.md`, depends on design
  - `agent-backend` — implements API + D1 + Gemini proxy from `04-backend-spec.md`
  - `agent-agent` — implements the agent UI + event bus from `05-agent-spec.md`, depends on frontend + backend
  - `agent-deploy` — sets up GitHub + CF projects + workflows from this file

- **Shared context**: mount the whole `spec/the-tile/` directory on every agent via `shared/` in Agent Teams config
- **Termination**: when each agent's DoD checklist in its respective spec file passes

Expected session time: 3-6 hours of parallel work. Expected token cost: $20-60 for the Coordinator + agents combined, plus session-hour surcharges (~$0.08/hr × 5 agents × 6 hrs = $2.40).

After build, Claude Cowork can take over operational changes: "add this tile series", "update the about page", "send me the lead log for March" — all without developer involvement.

---

## 11. Definition of Done (deploy)

- Both staging + production environments stand up from scratch in under 60 minutes following this document
- All GitHub Actions workflows green on their first successful run
- D1 migrations applied, seed synced, sample lead created and email received in testing
- TLS (auto via CF), HSTS, CSP headers configured (see `apps/web/middleware.ts` for CSP directives)
- Old Weebly 301 redirects verified with a crawl of the current sitemap
- Uptime monitor configured, first alert successfully fired (via artificial trip) and received
- Team handbook delivered to The Tile in both docs + a 20-minute recorded walkthrough

## 12. Open questions (deploy)

- **Who owns the GitHub org** — The Tile, or the implementer transferring ownership post-launch? Transfer post-launch is standard for agency builds; flag in the pitch.
- **Cloudflare account ownership** — same. Best practice: The Tile owns the CF account, implementer has admin access that can be revoked.
- **Pre-launch content sign-off** — The Tile needs to approve the voice, the about page, and the initial journal articles before cutover. Build a 1-week content-review buffer into the timeline.
