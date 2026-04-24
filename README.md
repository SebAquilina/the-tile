# The Tile — agent-first website

Production rebuild of [the-tile.com](https://www.the-tile.com) — a porcelain-stoneware specialist in San Gwann, Malta, operating since 1990. Replaces a Weebly site with an agent-first Next.js 14 build on Cloudflare Pages + Gemini 3.1 Flash-Lite.

Full specification: [`docs/spec/the-tile/`](./docs/spec/the-tile/).

## What makes it different

1. **Agent-first home page.** First visit is a full-viewport concierge — "What are you looking for?" — not a catalogue. Plain-text starter chips, `[just let me browse]` fallback. Returning visitors see a conventional home with the agent reachable via a floating bubble.
2. **Thirty years of curation as the product.** The concierge knows every one of the 60 series The Tile carries, all 5 Italian suppliers, and the usage patterns that matter in Malta (coastal humidity, sun, R-rated outdoor paving). It recommends, it doesn't list.
3. **Quote-driven, not cart-driven.** No checkout. A shortlist you can save and ship straight into a quote request.
4. **Data-first.** Seed JSON is the source of truth; the catalog, the sitemap, the 301 redirects, and the agent's grounding are all generated from it.

## Project layout

```
the-tile/
├── apps/web/                # Next.js 14 App Router
│   ├── app/                 # Routes (public group), API routes, sitemap/robots
│   ├── components/          # ui/ · layout/ · catalog/ · agent/ · forms/
│   ├── lib/                 # schemas · seed loaders · agent client · jsonld · rate-limit · resend · turnstile
│   ├── data/seed/           # copied from docs/spec at postinstall
│   ├── scripts/             # sync-data · build-agent-context · generate-redirects
│   ├── tests/               # Vitest: schemas · agent-client · rate-limit
│   └── middleware.ts        # CSP, HSTS, Referrer-Policy, X-Frame, Permissions-Policy
└── docs/spec/the-tile/      # Full locked spec (18 files, ~5,700 lines)
    └── seed/                # 60 products · 5 brands · content
```

## Key routes

| Path | Kind | Notes |
|------|------|-------|
| `/` | Static | AgentHero on first visit, home content + bubble on return |
| `/collections` | Dynamic SSR | All 60 tiles, URL-synced facets, server-rendered grid |
| `/collections/[effect]` | SSG × 9 | One per effect (marble, wood, stone, slate, concrete, terrazzo, terracotta, gesso, full-colour) |
| `/collections/[effect]/[slug]` | SSG × 60 | Product detail with specs, related, save-to-list |
| `/brands` + `/brands/[slug]` | SSG × 5 | Emilgroup, Emilceramica, Ergon, Provenza, Viva |
| `/journal` + `/journal/[slug]` | SSG × 2 | Two launch articles |
| `/save-list` | Static | sessionStorage-backed shortlist → quote deep-link |
| `/about`, `/showroom`, `/contact` | Static | Italian-concierge copy |
| `/privacy`, `/terms`, `/cookies` | Static | GDPR drafts (Malta) |
| `/api/agent/chat` | Edge | Gemini 3.1 Flash-Lite SSE proxy with rate limits + Turnstile gate |
| `/api/contact` | Node | Zod-validated lead → Resend (feature-flagged) → `/api/health` |
| `/sitemap.xml` · `/robots.txt` | Generated | 82 URLs · disallow `/api/` and `/test/` |

## Running locally

```bash
cd apps/web
cp .env.example .env.local             # then paste GEMINI_API_KEY
pnpm install                            # runs sync-data + build-agent-context + generate-redirects
pnpm dev                                # http://localhost:3000
```

A Gemini API key is the only required env var. Turnstile / Resend / Plausible / Sentry are all feature-flagged — absent keys degrade gracefully.

### Scripts

```
pnpm dev                  # Next.js dev server
pnpm build                # production build (77 routes)
pnpm start                # serve the production build
pnpm test                 # Vitest — schemas, agent-client, rate-limit (14 tests)
pnpm typecheck            # tsc --noEmit
pnpm lint                 # next lint
pnpm generate-redirects   # regenerate public/_redirects from seed sourceUrls
pnpm build-agent-context  # rebuild lib/agent-system-prompt.ts from spec files
```

## Tech

- **Next.js 14 App Router** · TypeScript strict
- **Tailwind CSS** — every utility maps to a CSS custom property in `app/tokens.css` (light + dark)
- **Fraunces + Inter** — self-hosted via `@fontsource`
- **Zod** — schemas for catalog, leads, agent messages
- **react-markdown + rehype-sanitize** — agent + journal rendering
- **react-hook-form + zodResolver** — contact form
- **Gemini 3.1 Flash-Lite** via REST `:streamGenerateContent?alt=sse`
- **Vitest** — unit tests
- **Cloudflare Pages + Pages Functions** — target hosting (see `docs/spec/the-tile/09-deploy-plan.md`)

## Agent grounding

`scripts/build-agent-context.ts` concatenates the populated system prompt from `docs/spec/the-tile/07-agent-system-prompt.md` (fenced code block) with the full site knowledge from `06-site-knowledge.md` — ~46K characters, ~11.5K tokens. Compiled once at `postinstall`, loaded as a string constant in the Edge route. No runtime disk reads.

The agent emits a structured `---ACTIONS---` trailer that the frontend parses into 8 action types: `navigate`, `scroll`, `filter`, `highlight-products`, `add-to-save-list`, `open-save-list`, `submit-lead`, `escalate` — plus `cite` metadata for analytics. See `docs/spec/the-tile/05-agent-spec.md §4-5`.

## What's Phase 2 and beyond

Not yet built (spec Phase 2-3):
- Maltese + Italian translations (routing scaffolded via `locale` in `localBusinessLd()` but content is EN only)
- Cal.com showroom booking integration
- Commissioned showroom + product photography (supplier imagery licensing is a blocker for current assets)
- Lightweight admin UI for non-technical tile edits
- R2 image hosting with on-the-fly resize
- WhatsApp Business API integration
- A/B tests on agent starter-chip copy

The spec lists the rest in [`docs/spec/the-tile/BLUEPRINT.md §Phased delivery`](./docs/spec/the-tile/BLUEPRINT.md).

## Cost

Per `docs/spec/the-tile/09-deploy-plan.md §9`: roughly €12–15 / month at steady-state (2K uniques / month, 20% agent engagement). Cloudflare + D1 + Turnstile free tiers. Plausible €9. Gemini €1–3. Domain renewal €1.

## Licence + credits

Spec produced by the `agent-first-website` skill · April 2026. Build by Claude (Opus 4.7 coordinator + Sonnet 4.6 subagents) across 4 waves on branch `claude/the-tile-coordinator-O8HVL`. Not open-source — this repository is owned by The Tile.
