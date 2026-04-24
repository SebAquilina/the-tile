# Frontend Tasks

**For**: implementation agent (Claude Code or human dev)
**References**: `01-design-system.md`, `02-information-architecture.md`, `03-frontend-spec.md`

Sequenced. Each task is a small, reviewable PR-sized unit. Check off as completed.

---

## Setup (1 day)

- [ ] **F-001** Init Next.js 14 App Router project in `apps/web/` using `pnpm create next-app` with TypeScript, Tailwind, ESLint, App Router
- [ ] **F-002** Configure pnpm workspaces in repo root
- [ ] **F-003** Install dependencies: `@fontsource/fraunces`, `@fontsource/inter`, `lucide-react`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-markdown`, `rehype-sanitize`, `drizzle-orm`, `drizzle-kit`, `@cloudflare/d1` (dev)
- [ ] **F-004** Set up `tokens.css` with all CSS custom properties from `01-design-system.md §3-5`
- [ ] **F-005** Configure `tailwind.config.ts` to map utilities to CSS vars
- [ ] **F-006** Set up ESLint rules: `tailwindcss/no-arbitrary-values` + custom rule preventing hardcoded colours / fonts in components
- [ ] **F-007** Set up font self-hosting via `@fontsource` packages + preload directives in root layout
- [ ] **F-008** Configure `next.config.mjs`: image domains if using remote imagery, ISR defaults, output for CF Pages
- [ ] **F-009** Symlink/copy spec/seed to `apps/web/data/` via a `sync-data.ts` script run on `postinstall`

## Primitives (2-3 days)

- [ ] **F-010** `ui/Button` — all variants + states + tests + Storybook-style documentation in-code
- [ ] **F-011** `ui/Input` + `ui/Textarea` — with labels, error states, a11y attributes
- [ ] **F-012** `ui/Select` — native on mobile, custom listbox on desktop, keyboard-navigable
- [ ] **F-013** `ui/Checkbox` + `ui/Radio` — accessible, visible focus
- [ ] **F-014** `ui/Modal` — using `<dialog>`, focus trap, Esc to close, body scroll lock
- [ ] **F-015** `ui/Toast` — accessible live region, auto-dismiss, stacking
- [ ] **F-016** `ui/Skeleton` — for loading states on cards and lists

## Layout (2 days)

- [ ] **F-017** `layout/Header` — logo, nav items, agent toggle, save-list counter, sticky-on-scroll shrink behaviour
- [ ] **F-018** `layout/MobileNav` — full-screen overlay drawer, Esc closes, focus management
- [ ] **F-019** `layout/Footer` — 4-col fat footer, newsletter signup (phase 2 stub), legal links
- [ ] **F-020** `layout/Breadcrumb` — hidden on hero pages, visible on catalog + product
- [ ] **F-021** `app/(public)/layout.tsx` — site shell wiring all above + AgentMount + Toaster

## Data layer (1 day)

- [ ] **F-022** Zod schemas in `lib/schemas.ts` for Product, Category, Brand, Lead, AgentMessage (shared with API)
- [ ] **F-023** `lib/seed.ts` — typed loaders for seed JSON files, caches in module scope
- [ ] **F-024** `lib/save-list.ts` — React Context + reducer, persists to sessionStorage, `useSaveList()` hook

## Catalog (3-4 days)

- [ ] **F-025** `catalog/TileCard` — 1:1 aspect, hover behaviour, skeleton variant, a11y-clean
- [ ] **F-026** `catalog/TileGrid` — 4/2 responsive, empty state, filter-driven updates
- [ ] **F-027** `catalog/FilterBar` — sticky desktop, drawer mobile, URL-synced, keyboard-navigable
- [ ] **F-028** `catalog/SpecsTable` — compact 2-column spec display
- [ ] **F-029** `catalog/RelatedTiles` — horizontal scroll rail, 4-6 items
- [ ] **F-030** `catalog/SaveToListButton` — heart-icon toggle, animates only on click
- [ ] **F-031** `app/(public)/collections/page.tsx` — all 60 tiles, filtered, paginated
- [ ] **F-032** `app/(public)/collections/[effect]/page.tsx` — effect landing, dynamic routes for all 9 effects
- [ ] **F-033** `app/(public)/collections/[effect]/[slug]/page.tsx` — product detail with all sections from `02-IA §5`
- [ ] **F-034** `app/(public)/usage/[slug]/page.tsx` — bathroom, outdoor-paving, paving-20mm

## Agent (3-4 days)

- [ ] **F-035** `lib/events.ts` — typed event bus for agent→frontend actions
- [ ] **F-036** `lib/agent-client.ts` — POST to `/api/agent/chat`, SSE stream handler, action trailer parser
- [ ] **F-037** `agent/AgentPanel` — side-panel (desktop) + full-sheet (mobile), message list, streaming render, Markdown with rehype-sanitize
- [ ] **F-038** `agent/AgentBubble` — floating 56px, opens panel
- [ ] **F-039** `agent/AgentHero` — full-viewport greeting, autofocused input, 4 starter chips, `[just let me browse]`, morph to panel on submit
- [ ] **F-040** `agent/ActionReceipt` — inline receipts for filter / navigate / submit-lead / escalate actions
- [ ] **F-041** Hook action events to router, FilterBar, SaveList, contact form

## Secondary pages (2-3 days)

- [ ] **F-042** `app/(public)/page.tsx` — home (first-visit + return-visit variants)
- [ ] **F-043** `app/(public)/brands/page.tsx` + `[slug]/page.tsx`
- [ ] **F-044** `app/(public)/showroom/page.tsx`
- [ ] **F-045** `app/(public)/about/page.tsx`
- [ ] **F-046** `app/(public)/contact/page.tsx` + ContactForm component
- [ ] **F-047** `app/(public)/journal/page.tsx` + `[slug]/page.tsx`
- [ ] **F-048** `app/(public)/save-list/page.tsx` — list of saved tiles with quote-request CTA
- [ ] **F-049** Legal pages — `/privacy`, `/terms`, `/cookies`
- [ ] **F-050** `app/not-found.tsx` — custom 404

## SEO + redirects (1 day)

- [ ] **F-051** `scripts/generate-sitemap.ts` — reads seed + static routes
- [ ] **F-052** `scripts/generate-redirects.ts` — outputs `_redirects` for CF Pages per `02-IA §3`
- [ ] **F-053** `app/sitemap.ts` — Next.js sitemap export
- [ ] **F-054** `app/robots.ts` — robots export
- [ ] **F-055** JSON-LD on each page template (Organization, LocalBusiness, Product, BreadcrumbList, FAQ)
- [ ] **F-056** OG image generation route `app/og/[type]/route.ts` (optional, else use static OG images in `public/`)

## Polish (2 days)

- [ ] **F-057** Dark mode toggle — auto via `prefers-color-scheme` + manual toggle in footer
- [ ] **F-058** Analytics: Plausible snippet, custom events per `04-backend-spec.md §5`
- [ ] **F-059** Sentry SDK with proper env + PII scrub
- [ ] **F-060** axe-clean sweep per page template
- [ ] **F-061** Keyboard-only navigation test — every interactive element reachable
- [ ] **F-062** Lighthouse CI config with budgets from `03-frontend-spec.md §6`
- [ ] **F-063** VoiceOver / NVDA screen-reader test
- [ ] **F-064** `prefers-reduced-motion` audit — non-essential motion disabled

## Testing (2 days, can parallel polish)

- [ ] **F-065** Vitest unit tests for `lib/*` utilities (90% coverage target)
- [ ] **F-066** Component tests for Button, Input, FilterBar, TileCard, AgentPanel
- [ ] **F-067** Playwright E2E for 5 critical flows in `03-frontend-spec.md §8`
- [ ] **F-068** axe-core integration in Playwright

---

**Total estimate**: 18-22 working days (3.5-4.5 weeks) for a single senior frontend dev. Parallelisable to ~2 weeks with two people or Agent Teams.
