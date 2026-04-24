# 03 — Frontend Spec

**Project**: The Tile · agent-first rebuild

Implementation agent: before building any component, load `/mnt/skills/public/frontend-design/SKILL.md` — it codifies the anti-generic-AI aesthetic this project demands.

---

## 1. Stack

**Framework**: **Next.js 14+ (App Router)** on **Cloudflare Pages**.

**Why Next.js**:
- Server components produce static HTML for catalog/product pages — fast LCP, great SEO
- Client islands where we need them (filter bar, agent widget, save-list)
- Image optimisation built-in (`next/image`), critical for tile-photo-heavy pages
- Incremental Static Regeneration for low-friction content updates when the seed JSON changes

**Why not Astro**: considered, but the agent panel + filter interaction complexity makes a full React tree the cleaner call. Astro is better when interactivity is rare islands; here the agent + filters + save-list are interlocked state.

**Why Cloudflare Pages (not Vercel)**:
- Co-located with the Gemini proxy Worker (lower latency)
- Generous free tier that covers expected tile-shop traffic
- Git-integrated deploys from the same repo as the Worker

### Supporting libraries

| Need | Pick | Reason |
|---|---|---|
| Styling | **Tailwind CSS 3.4+** with CSS custom properties | Design tokens live as CSS vars in `tokens.css`, Tailwind maps utility classes to them |
| Icons | **Lucide React** | Clean, consistent, tree-shakeable |
| Form state | **React Hook Form** + **Zod** | Typed schemas shared between client and API routes |
| Content rendering | **React Markdown** + **rehype-sanitize** | Agent responses are Markdown-rendered, must be sanitised |
| Analytics | **Plausible** | Privacy-friendly, cookieless, GDPR-simple |
| Monitoring | **Sentry** | Errors + performance |
| Testing | **Vitest** (unit) + **Playwright** (E2E + a11y) | |

No state management library. App state is simple enough for React context + `useReducer` for the save-list and agent conversation. Avoid Redux/Zustand overhead.

---

## 2. Project layout

```
the-tile/
├── apps/
│   └── web/                               # Next.js app
│       ├── app/
│       │   ├── (public)/
│       │   │   ├── layout.tsx             # site shell: Header, Footer, AgentMount
│       │   │   ├── page.tsx               # home
│       │   │   ├── collections/
│       │   │   │   ├── page.tsx           # /collections
│       │   │   │   ├── [effect]/
│       │   │   │   │   ├── page.tsx       # /collections/[effect]
│       │   │   │   │   └── [slug]/
│       │   │   │   │       └── page.tsx   # /collections/[effect]/[slug]
│       │   │   ├── usage/[slug]/page.tsx
│       │   │   ├── brands/
│       │   │   ├── showroom/page.tsx
│       │   │   ├── about/page.tsx
│       │   │   ├── contact/page.tsx
│       │   │   ├── journal/
│       │   │   ├── save-list/page.tsx
│       │   │   └── legal/(privacy|terms|cookies)/page.tsx
│       │   ├── api/
│       │   │   ├── agent/chat/route.ts    # proxy to Gemini (Edge runtime)
│       │   │   ├── contact/route.ts       # contact form submission
│       │   │   └── save-list/route.ts     # optional persistence endpoint
│       │   ├── globals.css
│       │   └── tokens.css                 # design tokens as CSS vars
│       ├── components/
│       │   ├── agent/                     # AgentHero, AgentBubble, AgentPanel, ActionReceipt
│       │   ├── catalog/                   # TileCard, TileGrid, FilterBar, SpecsTable
│       │   ├── layout/                    # Header, Footer, Breadcrumb, MobileNav
│       │   ├── forms/                     # ContactForm, SaveListPanel
│       │   ├── ui/                        # Button, Input, Select, Checkbox, Modal, Toast
│       │   └── content/                   # Prose, Pullquote, ArticleHero
│       ├── lib/
│       │   ├── agent-client.ts            # calls /api/agent/chat, handles SSE + action trailer
│       │   ├── events.ts                  # nav-directive event bus for agent↔frontend
│       │   ├── save-list.ts               # context + reducer for saved tiles
│       │   ├── schemas.ts                 # Zod schemas for products, content, forms
│       │   └── seed.ts                    # typed loaders for seed JSON files
│       ├── data/                          # symlink or copy from spec/seed/ at build
│       │   ├── products.json
│       │   ├── brands.json
│       │   └── content.json
│       ├── tailwind.config.ts
│       ├── next.config.mjs
│       └── package.json
├── workers/
│   └── agent-proxy/                       # Cloudflare Worker (if not using Next route)
├── scripts/
│   ├── generate-redirects.ts              # reads seed → outputs _redirects for CF Pages
│   ├── generate-sitemap.ts                # reads seed → outputs sitemap.xml at build
│   └── validate-seed.ts                   # Zod-validates all seed files before build
├── docs/                                  # this spec directory, copied here
├── .github/workflows/
├── .env.example
└── README.md
```

The `apps/web/data/` directory is populated at build time from `spec/seed/`. Do not hand-edit.

---

## 3. Design tokens wiring

`tokens.css`: declares all tokens from `01-design-system.md` as CSS custom properties under `:root` + `@media (prefers-color-scheme: dark)` overrides + a `[data-theme="dark"]` manual-toggle override.

`tailwind.config.ts` maps utility classes to the vars:

```ts
colors: {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  'surface-muted': 'var(--color-surface-muted)',
  text: {
    DEFAULT: 'var(--color-text)',
    muted: 'var(--color-text-muted)',
    subtle: 'var(--color-text-subtle)',
  },
  line: 'var(--color-line)',
  brand: 'var(--color-brand)',
  accent: 'var(--color-accent)',
  error: 'var(--color-error)',
  success: 'var(--color-success)',
},
fontFamily: {
  display: ['var(--font-display)', 'serif'],
  sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
},
fontSize: {
  xs: ['var(--font-size-xs)', { lineHeight: '1.5' }],
  /* …all tokens */
},
spacing: {
  1: 'var(--space-1)',
  /* …through 11 */
},
```

**Rule**: no hardcoded hex, px, or font-family in component files. Every visual value references a token. Lint rule (`tailwindcss/no-arbitrary-values` + custom ESLint rule) enforces this in CI.

---

## 4. Component acceptance criteria (the things that MUST be true for DoD)

A handful called out; the full inventory in `01-design-system.md §7`.

### Button

- Minimum touch target 44×44px on mobile (padding as needed)
- `focus-visible` ring is 2px offset using `--color-focus-ring`
- Loading state shows a spinner and sets `aria-busy="true"` without disabling the button (user can still Esc)
- Primary variant uses `--color-brand` bg, `--color-bg` text
- Secondary is outlined using `--color-line`, text `--color-text`
- Ghost is text-only, underline on hover
- No gradients, no inner shadow, no pseudo-3D

### TileCard

- Image uses `next/image` with `fill`, `sizes` set responsively, and `loading="lazy"` except for the first 4 cards above the fold (`priority`)
- Aspect ratio locked to 1:1 via `aspect-square` class
- Entire card is one `<a>` wrapping image + name + meta — no nested interactive elements
- Hover transform: `scale(1.02)` on the image only, card stays put
- No visible "Add to cart" button — the primary card interaction is "click through to detail"; save-to-list is on the detail page or via agent
- Skeleton variant for loading states (matching aspect + a shimmer gradient)

### FilterBar

- URL-synced: every filter change updates the query string (`router.replace`, not `push`, to avoid back-button pollution)
- Active filters render as removable pills above the grid
- "Clear all" link visible when any filter is active
- Desktop: sticky below the header at scroll; mobile: full-screen drawer opened by a "Filter" button, dismissed on apply
- Keyboard: Tab through filters, Space/Enter to toggle, Esc closes drawer
- Each filter group is a `<fieldset>` with `<legend>` for screen readers

### AgentHero

- Full viewport on first load (`100vh`, `100dvh` for mobile address-bar handling)
- Centered layout: brand wordmark small at top, display headline center, chat input below, starter chips below input, `[just let me browse]` link at bottom
- Chat input receives focus on mount (unless the user has `prefers-reduced-motion` *and* is returning — then the hero is collapsed from the start)
- Typing starts a streaming response; the hero doesn't navigate away, it morphs into the AgentPanel (same component, just transitioning from full-viewport to side-panel) once the first response arrives
- `[just let me browse]` collapses the hero with a 400ms ease-in-out, scrolls to `#home-content`, plants the AgentBubble bottom-right
- Background: subtle gradient mesh animation at very low opacity (disabled under `prefers-reduced-motion`), a single tile macro image with 30% opacity, or a solid `--color-surface-muted` fill. Pick one per brand direction — recommend solid for the pitch version and add richer treatments Phase 2.

### AgentPanel

- Desktop: slide-in side panel 420px wide from the right, positioned above all other content with `z-index: 50`
- Mobile: full-screen sheet, slides up from bottom (iOS-sheet pattern)
- Message list scrolls independently; input is pinned to the bottom
- Streaming responses: render tokens as they arrive, with a blinking caret during active stream
- Markdown in messages: bold, italic, lists, links — all other HTML stripped by `rehype-sanitize`
- Code fences rendered as inline code only (tile sites don't need real code blocks; prevent accidental surface-area expansion)
- Keyboard: Enter sends, Shift+Enter newlines, Esc minimises to bubble (does not clear conversation)
- Screen reader: new messages announced via a live region (`aria-live="polite"`)

### ActionReceipt (inline UI inside the panel)

- When the agent emits a `filter` action, panel renders a small card: "Showing · Marble · Indoor · Warm" with an undo button
- When it emits `navigate`, panel renders: "Taking you to: Marble Collections" (updates actively during the nav)
- When it emits `submit-lead`, panel renders a confirmation: "Message sent — they'll be in touch within 24h"
- Each receipt has its own `role` and semantic HTML appropriate to the action (navigation = link, undo = button)

---

## 5. Page-by-page build sequence

Order matters for the dependency chain; follow this sequence when implementing.

### Phase 1a — Foundation (no pages yet)

1. `tokens.css` + Tailwind config + global layout
2. `ui/` primitives: Button, Input, Select, Checkbox, Radio, Modal, Toast — all with light/dark, all with tests
3. `layout/Header`, `layout/Footer`, `layout/MobileNav`, `layout/Breadcrumb`
4. `lib/seed.ts`: typed loaders for `products.json`, `brands.json`, `content.json`; Zod schemas in `lib/schemas.ts`
5. `lib/save-list.ts`: context + reducer + `sessionStorage` persistence

### Phase 1b — Catalog shell

6. `catalog/TileCard`, `catalog/TileGrid`, `catalog/FilterBar`
7. `/collections` page — wired to products.json, filters functional, URL-synced
8. `/collections/[effect]` page — pre-filtered landing
9. `/collections/[effect]/[slug]` product detail page with SpecsTable, RelatedTiles, save-to-list

### Phase 1c — Agent

10. `lib/agent-client.ts` + `lib/events.ts`
11. `api/agent/chat` route (see `04-backend-spec.md` for the server-side spec)
12. `agent/AgentPanel` (side-panel + mobile-sheet variants)
13. `agent/AgentBubble`
14. `agent/AgentHero` (the full-viewport greeting)
15. Navigation directive handlers — hook up `filter`, `navigate`, `scroll`, `highlight-products`
16. `ActionReceipt` component

### Phase 1d — Secondary pages

17. `/` home (first-visit and return-visit variants)
18. `/showroom`, `/about`, `/contact`, `/brands`, `/brands/[slug]`
19. `/journal`, `/journal/[slug]` (read from content.json)
20. `/save-list`, all legal pages

### Phase 1e — Polish

21. Accessibility audit: axe clean on every page template
22. Lighthouse CI passing budgets (see below)
23. E2E test suite passing
24. 301 redirects from old site deployed
25. sitemap.xml + robots.txt validated

---

## 6. Performance budget

Hard targets, enforced by Lighthouse CI. Any PR that regresses these fails the build.

| Page | LCP | INP | CLS | First-load JS (gzipped) | CSS |
|---|---|---|---|---|---|
| Home (first-visit, agent hero) | ≤ 2.0s | ≤ 150ms | ≤ 0.05 | ≤ 140KB | ≤ 40KB |
| Home (return-visit) | ≤ 1.8s | ≤ 150ms | ≤ 0.05 | ≤ 140KB | ≤ 40KB |
| Collections | ≤ 2.5s | ≤ 200ms | ≤ 0.10 | ≤ 170KB | ≤ 50KB |
| Product detail | ≤ 2.5s | ≤ 200ms | ≤ 0.10 | ≤ 170KB | ≤ 50KB |
| Static pages | ≤ 2.0s | ≤ 150ms | ≤ 0.05 | ≤ 120KB | ≤ 40KB |

**How we hit it**:
- Static pre-rendering for all catalog and marketing pages (ISR for content updates)
- `next/image` with AVIF+WebP output, 1600/800/400 widths, lazy below-fold
- Preload only the LCP hero image per page
- Self-hosted fonts with `@fontsource`, `font-display: swap`, preload the weights used
- Agent widget code-split: bubble loads on every page (tiny), panel lazy-loaded on first open
- Third-party scripts defer: Plausible is tiny and async-loaded, Sentry splits its SDK
- No client-side analytics beacons on the critical path

---

## 7. Accessibility budget

WCAG AA across the site. Hard rules:

- Every interactive element has a visible `:focus-visible` state using `--color-focus-ring`
- Every icon-only button has an `aria-label` or sibling `<span class="sr-only">`
- Form labels always visible (no float-labels)
- Error text associated via `aria-describedby`, announced via live region
- Contrast ratios: 4.5:1 body, 3:1 large text, 3:1 non-text UI (icons, borders around focusable elements)
- Keyboard nav: Tab, Shift+Tab reach everything; Enter/Space activate; Esc closes overlays
- No keyboard traps — especially in the agent panel (Esc always escapes)
- `prefers-reduced-motion: reduce` kills all non-essential motion (agent slide-in stays, parallax goes)
- Screen-reader test (VoiceOver or NVDA) on every page template: home, collections, product, showroom, contact. Agent flow must be fully operable via screen reader.

---

## 8. Testing

| Level | Tool | Coverage target |
|---|---|---|
| Unit | Vitest | `lib/*` utilities and schemas at 90%+ |
| Component | Vitest + Testing Library | All `ui/` primitives, FilterBar, TileCard, AgentPanel |
| E2E | Playwright | Critical flows (see below) |
| a11y | axe-core + Playwright | Run on every page template in CI |

Critical E2E flows:
1. Home loads, agent hero renders, typing "show me something warm for the kitchen" returns a response with at least one `highlight-products` action
2. `[just let me browse]` collapses hero, bubble appears, home content scrolls into view
3. `/collections` loads, applying `?effect=marble` filter narrows to marble tiles, URL updates, "Clear all" empties filters
4. Product detail opens, save-to-list adds, save-list drawer shows the tile, contact form auto-populates with saved tiles, submit returns a success
5. Agent on `/collections/marble/xlight-statuario-plus` explains the tile and recommends 2 related options; clicking a recommendation navigates to that product

---

## 9. Definition of Done (frontend)

- All phase 1a-e items complete
- Performance budgets passing in Lighthouse CI across all page templates
- axe-clean on all page templates
- E2E suite green in CI
- Redirect map deployed to Cloudflare Pages `_redirects` file
- Light + dark mode both visually reviewed by the designer / pitch presenter
- README with local dev setup (`pnpm install && pnpm dev` → works in under 30 seconds)

## 10. Open questions (frontend)

- **Image source**: until The Tile confirms which supplier imagery is licensed, the product detail pages ship with tile-flat shots only and `best-for` context-described-in-prose. Room-context imagery goes in Phase 2.
- **ISR revalidation cadence**: 60 seconds for `/collections*` pages, 300 for `/journal*`, static for legal. Tunable in `next.config.mjs`.
- **Mobile agent panel**: full-screen sheet vs. 70% height drawer — specced as full-screen for the pitch (maximal distinctiveness), but a 70% drawer keeps more site visible and may test better. Flag for post-pitch user-testing.
