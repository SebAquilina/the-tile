# 01 — Design System

**Project**: The Tile · agent-first rebuild
**Voice direction**: Design-forward Italian concierge — sophisticated, leaning into the Italian heritage (Emilgroup, Ergon, Tagina, Marca Corona). Calm confidence, not hard-sell. A curator, not a salesperson.

---

## 1. Design principles

These are the four decisions everything else flows from. Implementation agent: when in doubt on any visual call, resolve it by returning here.

1. **The tile is the hero, not the interface.** Tile photography is dense, textured, and expensive. The UI framework disappears around it: neutral surfaces, generous whitespace, minimal ornament, low-contrast chrome. If a UI element ever fights a tile image for attention, the UI loses.

2. **Italian editorial, not e-commerce.** Reference points: Emilgroup / Ergon own websites, Kinfolk, Apartamento, Alighieri, Marset. Avoid: big-box tile e-commerce (Home Depot, Wayfair, The Tile Shop US), neon "SALE" badges, sticker-style CTAs.

3. **Type does the heavy lifting.** No decorative illustration, no stock photo tropes, no over-animation. Typography and whitespace carry the brand — a well-set paragraph of copy says more than a motion flourish.

4. **Agent-first confidence.** The chat isn't bashful. On home load, it takes the whole viewport and asks a single question. The visual site lives underneath and is reached only after the user declines the agent.

---

## 2. Reference Digest

Sources read during Phase 2:

- **the-tile.com** (current site) — structural map of 12 categories and ~60 tile series (scraped 78 pages, all in `seed/products.seed.json`). Not a visual reference — the current site is dated and reflects the Weebly-template era. Borrow **nothing** visually; borrow **everything** informationally.

- **Supplier showcases** (Emilgroup / Ergon / Marca Corona / Tagina / Emilceramica) — these brands already publish design-forward websites. Study their tile-detail page structure: large imagery, room contexts, technical specs in a restrained table, clear downloads. Borrow the editorial rhythm, not the exact components.

**Visual tokens to borrow**
- Palette direction: near-monochrome base (bone/ivory/graphite), one low-saturation accent, zero semantic colour bloat
- Type feel: contemporary serif for display + geometric/humanist sans for body, strong weight contrast
- Spacing: generous (8px base, but leaning toward 16/24/48/96 for sectional rhythm)
- Motion: understated, ~200ms ease-out, functional only (no decorative bounces)

**Structural patterns to borrow**
- Hero: single-focus, one question, no competing CTAs (the agent handles this)
- Catalog: image-dense grid, aspect ratio locked for visual consistency, metadata light
- Product detail: full-bleed imagery up top, spec table, in-room context images, "also consider" rail
- Footer: fat-but-quiet — four columns, muted text

**What we are NOT taking**
- The current site's palette (messy black/white with a random teal and coral)
- The current site's type stack (5+ families fighting each other)
- Any supplier logos/wordmarks/photography without explicit permission (tile shots from supplier catalogs are usually licensed to dealers but this needs The Tile's confirmation — flagged in open questions)

---

## 3. Palette

Monochrome base, one muted Italian-warm accent, one focus-only secondary. Tuned for tile photography: every surface is a frame, never a competitor.

| Token | Light value | Dark value | Use |
|---|---|---|---|
| `--color-bg` | `#F7F5F0` (bone) | `#0F0E0C` (espresso near-black) | page background |
| `--color-surface` | `#FFFFFF` | `#1A1917` | cards, modals, agent panel |
| `--color-surface-muted` | `#EFEBE3` | `#22201D` | section banding |
| `--color-text` | `#0F0E0C` | `#F4F1E9` | primary body |
| `--color-text-muted` | `#56524A` | `#A8A197` | secondary / caption |
| `--color-text-subtle` | `#8B8579` | `#6D6760` | tertiary / metadata |
| `--color-line` | `#D9D3C6` | `#332F2A` | hairlines, dividers, form borders |
| `--color-brand` | `#5B4A2E` (burnt umber) | `#C4A87A` (warm ochre) | primary interactive, links, focus |
| `--color-accent` | `#7A6B5C` (terracotta-stone) | `#8F7F6B` | secondary highlights, pull-quotes |
| `--color-focus-ring` | `#5B4A2E33` (brand @ 20%) | `#C4A87A33` | :focus-visible outline |
| `--color-error` | `#9B3131` | `#C26A6A` | form errors, destructive |
| `--color-success` | `#3F5D3A` | `#8BA584` | confirmations |

**Why umber + ochre as brand**: the colour is Italian-quarry warm without being a beige cliché. It harmonises with marble, terracotta, wood-effect imagery — the exact spectrum of tile the business sells. Using a cold blue or a bright red would fight every second tile photo.

Dark mode is a first-class variant — many tile-browsing sessions happen in the evening from phones. Auto-switch via `prefers-color-scheme`, with a manual toggle in the footer.

---

## 4. Typography

Two families, both free via Google Fonts. No third-family exceptions — not even for monospace; if a mono is ever needed, use system stack (`ui-monospace`).

| Role | Family | Weights used |
|---|---|---|
| Display (H1, agent hero) | **Fraunces** (serif, optical size axis) | 300 (regular display), 500 (small display) |
| Body, UI, secondary headings | **Inter** | 400 (body), 500 (strong body / labels), 600 (H2-H4 UI) |

Self-host both via `@fontsource` packages; do not pull from Google's CDN at runtime (privacy + performance). Preload the Fraunces 300 weight (used LCP-relevant display text) and Inter 400.

**Scale (px / rem)**

| Token | px | Use |
|---|---|---|
| `--font-size-xs` | 12 / 0.75 | metadata, captions, legal |
| `--font-size-sm` | 14 / 0.875 | UI labels, form hints |
| `--font-size-base` | 16 / 1.0 | body |
| `--font-size-lg` | 18 / 1.125 | lead paragraphs |
| `--font-size-xl` | 22 / 1.375 | H4 |
| `--font-size-2xl` | 28 / 1.75 | H3 |
| `--font-size-3xl` | 36 / 2.25 | H2 |
| `--font-size-4xl` | 52 / 3.25 | H1 / section display |
| `--font-size-5xl` | 80 / 5.0 | agent hero on desktop |
| `--font-size-6xl` | 112 / 7.0 | optional editorial flourish |

Fluid sizing between breakpoints via `clamp()`. Agent hero example:
```css
.agent-hero-headline {
  font-size: clamp(2.5rem, 6vw + 1rem, 5rem);
  font-family: var(--font-display);
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.0;
}
```

**Line-heights**: `1.1` (display), `1.3` (headings), `1.55` (body), `1.75` (long-form).
**Tracking**: negative on display (-0.02em), neutral on body, positive (0.04em) on all-caps UI labels.

---

## 5. Spacing, radius, shadow, motion

**Space scale (px)**: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192
As CSS vars: `--space-1` through `--space-11`. The jump from 64 → 96 is deliberate; the site uses oversized whitespace at section boundaries.

**Radius**: `0` (strict) / `2` (inputs) / `8` (cards) / `16` (modals, agent panel) / `9999` (pills).
Tile imagery is always square or 4:3, radius 0 — no rounded tile cards. Radius applies to UI chrome only.

**Shadow** (all cast brand-warm, never neutral grey):
- `--shadow-sm`: `0 1px 2px rgba(91, 74, 46, 0.06)`
- `--shadow-md`: `0 4px 16px rgba(91, 74, 46, 0.08)`
- `--shadow-lg`: `0 20px 48px rgba(91, 74, 46, 0.12)`

Used sparingly. Flat surfaces are the default; shadow only for modals and the floating agent bubble.

**Motion**:
- `--duration-fast`: 150ms (hover, focus)
- `--duration-med`: 250ms (expand/collapse, nav)
- `--duration-slow`: 400ms (page transitions, agent open/close)
- `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)` (standard)
- `--ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)` (bidirectional)

No spring, no bounce, no scale-on-hover beyond 1.02. `prefers-reduced-motion: reduce` kills all non-essential animation (keep functional transitions like modal open/close, but remove parallax, reveal-on-scroll, and hover movement).

---

## 6. Grid & layout

- Max content width: `1280px` for standard content, `1440px` for image-heavy pages
- Outer gutter: `24px` mobile, `48px` tablet, `96px` desktop
- Inner grid: `12 cols / 32px gutter` desktop, `6 cols / 24px` tablet, `4 cols / 16px` mobile
- Catalog grid: `4 cols desktop / 2 cols mobile`. Tile aspect ratio: `1:1` (square) — matches how tiles are almost always photographed in-context
- Breakpoints: `480 / 768 / 1024 / 1280 / 1536`

---

## 7. Component inventory

Every component the site needs. Each has: purpose, states, a11y notes, acceptance criteria. Full implementation in `03-frontend-spec.md`.

### Primitives

| Component | Variants | States | Notes |
|---|---|---|---|
| Button | primary · secondary · ghost · link | default · hover · focus-visible · active · disabled · loading | 44px min height; brand-umber fill for primary; no gradients; no icons inside text buttons unless semantically meaningful |
| Input | text · email · textarea | default · focus · error · disabled · filled | Labels always visible above input (no float-labels — they fail at a11y); error text announced via `aria-describedby` |
| Select | single · multi (for filters) | default · open · focused · filled | Native `<select>` on mobile, custom dropdown on desktop (listbox pattern) |
| Checkbox / Radio | single · grouped | default · checked · focus · disabled | Custom visual, native control underneath for a11y |
| Modal | small · medium · full | open · closing | Uses `<dialog>`; focus trap; Esc closes; body scroll lock |
| Toast | info · success · error | auto-dismiss 5s / persistent | `role="status"` soft, `role="alert"` urgent; max 3 stacked |

### Layout / navigation

| Component | Purpose |
|---|---|
| `Header` | logo-left · nav-center · agent-toggle-right. Sticky on scroll past 200px with a subtle shadow and scaled-down vertical padding. |
| `Footer` | 4-col fat footer: About · Collections · Visit · Legal. Brand-wordmark top, copyright small bottom. |
| `Breadcrumb` | Hidden on home/agent-hero; visible on catalog + product-detail pages |
| `MobileNav` | Full-screen overlay drawer, slides from right in 300ms, trap focus, Esc closes |
| `SectionBanding` | Full-bleed colour band using `--color-surface-muted`, used to separate major home sections |

### Catalog

| Component | Purpose |
|---|---|
| `TileCard` | Image (1:1, lazy) + name + effect label + brand tag (small). Hover: soft image zoom (1.02), never lift. Whole card is one `<a>`. |
| `TileGrid` | Responsive 4/2 col grid. Skeleton loaders while catalog fetches. Handles empty-filter state with an "Adjust filters" CTA. |
| `FilterBar` | Sticky below hero on `/collections`. Chips for active filters, each removable; "Clear all"; URL-synced. Desktop: inline; mobile: full-screen drawer. |
| `TileDetailHero` | Full-bleed lead image, title overlay positioned bottom-left, fade-in from dark gradient |
| `SpecsTable` | Two-column table of technical attributes (format, finish, thickness, usage). Minimal borders, no alternate-row fill. |
| `RelatedTiles` | Horizontal scroll rail of 4-6 complementary tiles — "from the same collection", "same effect", "works with" |
| `SaveToListButton` | Heart-icon toggle, animates only on click, stores in sessionStorage (or user cart if auth added later) |

### Agent (the star)

| Component | Purpose |
|---|---|
| `AgentHero` | Full-viewport, centered. Display headline "What are you looking for?" + chat input focused on load + 4 starter chips + small `[just let me browse]` exit |
| `AgentBubble` | Floating bottom-right, present after user exits hero or on any non-home page. 56px diameter, brand-umber, single icon |
| `AgentPanel` | Slide-in side panel (desktop, 420px wide) or full-screen sheet (mobile). Message list + input. Markdown render (sanitised). Streaming text rendering. |
| `ActionReceipt` | Inline UI card inside the agent panel showing: "Filtered to: Marble · Indoor · Warm" with undo — gives visual feedback when the agent emits actions |

### Forms

| Component | Purpose |
|---|---|
| `ContactForm` | Name · Email · Phone (optional) · Project notes · Selected tiles from save-list (auto-filled) · Consent checkbox |
| `SaveListPanel` | Drawer showing saved tiles with qty-per-m², total estimated area, "Request Quote" CTA opening ContactForm |

---

## 8. Iconography

**Lucide React** (free, clean, consistent). Import only what you use — no whole-library imports.

Never emoji in UI chrome. Never bespoke illustration icons unless explicitly specced as an asset.

Icon sizes: `16 / 20 / 24`. Always paired with an accessible label (`aria-label` on icon-only buttons, or sibling `<span class="sr-only">`).

---

## 9. Imagery

- **Tile photography**: provided by suppliers via their dealer portals (Emilgroup, Ergon, etc.). Expected formats: large JPG 1500-3000px, sometimes 4K. Pipeline must resize to 1600/800/400 and serve AVIF/WebP/JPG via `<picture>`.
- **Room-context photography**: mix of supplier imagery (lifestyle shots from catalogs) and, eventually, showroom-produced photos. Phase 2 brief: The Tile to commission 6-8 hero room shots in their San Gwann showroom.
- **No stock photography** for people or lifestyle. If a placeholder is needed, use an abstract tile macro.

Image budget (hard caps, enforced in CI):
- Hero image: ≤ 300KB (AVIF) / 500KB (WebP)
- Tile catalog image: ≤ 80KB (AVIF) / 120KB (WebP)
- Room context: ≤ 200KB (AVIF) / 300KB (WebP)

---

## 10. Voice (writing the brand)

Three anchor phrases the implementation agent should internalise before writing any copy:

**Anchor 1 — About the business**
> "The Tile has been bringing Italy's best porcelain stoneware to Malta since 1990 — curating collections from Emilgroup, Ergon, Tagina and others, and helping homeowners and architects find the right tile for the right room."

**Anchor 2 — About the agent**
> "Describe the room, and we'll find the tile. Thirty years of curating means we know which of our six hundred collections fits the brief — and why. Ask us anything."

**Anchor 3 — About a specific tile (template)**
> "[Name] from [Brand]'s [Collection] series — [effect] with [1-2 defining adjectives]. Ideal for [best-for scenarios]. Available in [formats], finished [finish options]."

**Do**
- Use specific tile and collection names (we have 60 in the seed — use them)
- Credit the Italian makers by name (Emilgroup, Ergon, Tagina, Marca Corona)
- Describe rooms, not abstractions ("a warm living room with evening light" beats "residential interior")
- Speak with thirty years of confidence — this business has chosen which tiles are worth carrying

**Don't**
- "Industry-leading" / "premium solutions" / "unparalleled"
- Hype modifiers ("STUNNING!" "GORGEOUS!")
- Hide the showroom model — they sell by quote, not by cart, and that's a feature (expertise + samples) not a limitation
- Apologise for the agent being AI — it's a tool, introduce it plainly

---

## 11. Definition of Done

- `tokens.css` exports all colour / type / spacing / radius / shadow / motion variables listed above
- Light and dark mode tokens defined
- Fraunces + Inter self-hosted via `@fontsource`, preloaded in `<head>`
- Tailwind config (if used) maps utility classes to the CSS vars (no hardcoded hex in component styles)
- All palette contrast ratios verified against WCAG AA via axe
- A `design-tokens.md` reference document in the repo duplicates this section for implementers who prefer reading in Markdown
- At least one component (Button) is built end-to-end as the reference implementation, demonstrating how tokens, focus states, loading states, and a11y meta should look in every other component

## 12. Open questions

- **Photography rights**: confirm with The Tile which supplier imagery is already licensed for web use. This is usually part of the dealer agreement but must be confirmed in writing before launch. If nothing is licensed, the site launches with text-first tile pages and a commissioned-photography phase 2.
- **Logo treatment**: the existing THE TILE logo is usable but could benefit from a wordmark refinement. Not blocking for Phase 1 — use the existing logo, flag a brand-refinement Phase 2 in the pitch.
- **Showroom photography**: commission or defer? Recommended: defer to Phase 2 (launch with supplier imagery + 2-3 detail shots), but mention in the pitch that great showroom photography would lift the brand significantly.
