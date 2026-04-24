# 02 — Information Architecture

**Project**: The Tile · agent-first rebuild

---

## 1. Site map

### Primary pages (in nav)

| URL | Purpose | Agent state on this page |
|---|---|---|
| `/` | Agent-first hero. On first-ever visit: full-viewport agent. On return visits within 24h: collapsed agent bubble + the static home below. | Full hero on first visit; bubble otherwise |
| `/collections` | Full catalog. Filter-driven browse. | Bubble, can open on demand |
| `/collections/[effect]` | Single-effect landing (e.g. `/collections/marble`). 9 total: marble · wood · stone · slate · concrete · terrazzo · terracotta · gesso · full-colour | Bubble |
| `/collections/[effect]/[slug]` | Individual tile series detail page. 60 of these (one per product in the seed). | Bubble |
| `/usage/bathroom`, `/usage/outdoor-paving`, `/usage/paving-20mm` | Cross-cutting usage landings | Bubble |
| `/brands` | Our brands page — the Italian suppliers | Bubble |
| `/brands/[slug]` | Single brand landing — their story + tiles we carry | Bubble |
| `/showroom` | Visit us · map · hours · "what to expect" · book a visit CTA | Bubble |
| `/about` | Story since 1990, team, values | Bubble |
| `/contact` | Form · email · phone · WhatsApp · map | Bubble |
| `/journal` | Articles / case studies / tile guides (seeded with 2-3 pieces for launch) | Bubble |
| `/journal/[slug]` | Individual article | Bubble |

### Utility pages

| URL | Purpose |
|---|---|
| `/save-list` | The user's saved-tile list — view, remove, proceed to quote request |
| `/privacy` | Privacy policy (GDPR) |
| `/terms` | Terms of use |
| `/cookies` | Cookie policy |
| `/404` | Not found — links back to catalogue and agent |
| `/sitemap.xml` | SEO sitemap (auto-generated) |
| `/robots.txt` | Standard |

### Agent-only routes (not in nav)

The agent can deep-link the user to anywhere via navigation directives. No pages exist only for the agent — everything the agent points at must also be discoverable by scrolling.

---

## 2. Navigation

### Primary nav (desktop)

Order matters — scanned left to right.

```
[THE TILE logo]  ·  Collections · Brands · Showroom · Journal · About  ·  [🗨 Ask]  [♡ 3]
```

- **"Ask"** button = opens the agent panel from anywhere. Always visible on desktop.
- **♡ 3** = save-list indicator, count = number of saved tiles. Clicking opens the save-list drawer.

Sticky behaviour: at scroll > 200px, the header shrinks (vertical padding halves), gains a subtle `--shadow-sm`, and the nav items gain a 1px underline on hover.

### Primary nav (mobile)

```
[☰]  THE TILE  [🗨]  [♡]
```

Hamburger opens a full-screen overlay drawer with the same nav items stacked vertically, plus the full collections list as an expandable accordion.

### Secondary nav

On `/collections` pages: a persistent sub-nav just below the header with the 9 effect categories (pills, horizontally scrollable on mobile). Active effect highlighted.

### Footer nav (4 columns)

| About | Collections | Visit | Legal |
|---|---|---|---|
| Our story | All collections | Showroom | Privacy |
| Brands we carry | By effect | Contact | Cookies |
| Journal | By room | WhatsApp | Terms |
| — | By usage | Book a visit | — |

Newsletter signup inline in footer (optional, Phase 2 if no list exists yet).

---

## 3. URL conventions

- Lowercase, hyphen-separated
- No trailing slash on canonical URLs; redirect trailing → no-trailing
- Effect slugs match the seed JSON exactly: `marble, wood, stone, slate, concrete, terrazzo, terracotta, gesso, full-colour`
- Product slugs mirror the scraped ID in `products.seed.json` (which matches their current site — preserves SEO equity where possible)
- Filter state encoded in query params: `/collections?effect=marble&usage=bathroom&colour=warm&format=large`

### URL redirects from old site

The current the-tile.com is on Weebly. Every URL with SEO equity must 301 to the new equivalent. Map:

| Old URL | New URL |
|---|---|
| `/marble-effect-tiles.html` | `/collections/marble` |
| `/wood-effect-tiles.html` | `/collections/wood` |
| `/stone-effect-tiles.html` | `/collections/stone` |
| `/concrete-effect-tiles.html` | `/collections/concrete` |
| `/slate.html` | `/collections/slate` |
| `/venetian-terrazzo-tiles.html` | `/collections/terrazzo` |
| `/kotto_brick.html` | `/collections/terracotta` |
| `/gesso--plaster-effect.html` | `/collections/gesso` |
| `/full_colour.html` | `/collections/full-colour` |
| `/bath.html` | `/usage/bathroom` |
| `/outdoor-tiles.html` | `/usage/outdoor-paving` |
| `/20mm-outdoor-solutions.html` | `/usage/paving-20mm` |
| `/about-us.html` | `/about` |
| `/contact-us.html` | `/contact` |
| `/our-brands.html` | `/brands` |
| `/news.html` | `/journal` |
| `/[tile-series].html` (60 product pages) | `/collections/[effect]/[tile-series]` |

Full redirect map is generated in `scripts/generate-redirects.ts` at build time from `seed/products.seed.json` — do not hand-maintain.

---

## 4. SEO structure

### Page title template

- Home: `The Tile — Italian Porcelain Stoneware in Malta since 1990`
- Collection landing: `[Effect] Tiles — The Tile`
- Product: `[Name] — [Effect] Tile — The Tile`
- Brand: `[Brand] — Collections at The Tile`
- Article: `[Title] — Journal — The Tile`

### Meta description

Template-per-page-type; never auto-generated from first paragraph only. Product pages pull from `products.seed.json` → `summary`. Collection landings have a hand-written 140-160 char description in `content.seed.json` under `collections.[slug].meta.description`.

### Canonical URLs

Every page emits a `<link rel="canonical">`. Filtered collection pages (`?effect=marble&usage=bathroom`) canonicalise to the unfiltered collection landing — don't index the permutations.

### Open Graph / Twitter Cards

- Home, collections: site-wide OG image (hero tile photograph, rendered at 1200×630)
- Product: per-tile hero image at 1200×630 generated from the primary product image
- Journal: per-article OG image

### Structured data (JSON-LD)

- `Organization` on home
- `LocalBusiness` on `/showroom` and `/contact` (with geo coords for Malta showroom)
- `Product` on each tile detail page (brand, image, name — no price since this is quote-driven; mark `priceSpecification` as "on-request")
- `BreadcrumbList` on catalog/product pages
- `FAQ` on `/showroom` and `/contact` for the most-asked questions

### Sitemap + robots

- `sitemap.xml` auto-generated at build from the static routes + `seed/products.seed.json`
- Update priority: home (1.0), collections (0.9), products (0.7), journal (0.6), legal (0.3)
- `robots.txt` allows all except `/api/*`, `/save-list` (personal state), and `/__preview/*` (if preview routes exist)

### Agent chat SEO

The agent panel is client-side, not crawlable. This is fine — the content the agent surfaces all lives on real crawlable pages. The agent doesn't create private knowledge; it just routes. Don't rely on the agent for discoverability.

---

## 5. Page-level section maps

Details in `03-frontend-spec.md`. Overview of what's on each primary page:

### `/` — Home (first-visit)

Full-viewport agent hero. If user declines (`[just let me browse]`), scroll to `#home-content` where a minimal home page lives:

```
1. Hero banner (tall, single tile hero image, brand headline "Italian stoneware. Chosen for Malta.")
2. Our collections — 9 effect cards in a 3×3 grid
3. A single featured series (swap weekly from /journal content)
4. Why The Tile — 3 pillars: "Curated since 1990", "Italian-first", "From selection to delivery"
5. Showroom CTA strip (full-width image + "Visit us in San Gwann")
6. Journal preview — latest 3 articles
7. Footer
```

### `/` — Home (return-visit)

Skip the full-viewport agent. Load straight into `#home-content`, with the agent bubble bottom-right and a gentle banner up top: "Welcome back — need help picking up where you left off? [Ask]".

### `/collections` — All-catalog landing

```
1. Breadcrumb (Home · Collections)
2. Page header — "Our Collections" + filter summary (e.g. "60 tiles across 9 effects")
3. Sub-nav — effect pills
4. FilterBar (effect · usage · room · colour · finish · format)
5. TileGrid (default: all 60)
6. Pagination or infinite-scroll (infinite for ≤200 items)
7. Footer
```

### `/collections/[effect]` — Effect landing

```
1. Breadcrumb
2. Effect hero — 3/4-viewport image of a room tiled in this effect, effect headline + 60-word intro (pulled from seed categories)
3. Sub-nav — effect pills
4. FilterBar (narrowed to within this effect)
5. TileGrid (filtered)
6. "Explore other effects" rail
7. Footer
```

### `/collections/[effect]/[slug]` — Product detail

```
1. Breadcrumb
2. Hero — full-bleed image of the tile in context (or flat tile shot if no context available)
3. Title + effect tag + brand tag
4. Summary (2-3 sentences from seed)
5. Image gallery — 4-6 images, click to zoom
6. Specs table (format, finish, thickness, usage indicators)
7. "Best for" pills (from seed)
8. Save-to-list CTA + "Request a sample" CTA
9. Description (longer form from seed)
10. In-room context images if available
11. Related — "From the same collection", "Same effect", "Works with"
12. Ask-the-agent CTA — "Not sure? Ask our concierge about this tile."
13. Footer
```

### `/showroom` — Visit us

```
1. Hero — photo of the showroom (or atmospheric placeholder), single CTA "Plan your visit"
2. Address · hours · map embed · parking notes
3. "What to expect" — 4 cards (browse samples, expert advice, take samples home, order + delivery)
4. Book-a-visit form (date, time, interest) OR "Contact us and we'll arrange a slot" depending on Phase 1 decision
5. Contact strip (email, phone, WhatsApp)
6. Footer
```

### `/about`, `/contact`, `/brands` — standard

Well-set long-form prose, consistent with the design system's editorial feel. No hero images beyond the page header.

### `/journal` — Content

Phase 1 launches with 2-3 seed articles specced in `content.seed.json` under `journal[]`. Suggested topics for launch:
- "Picking marble-effect tiles for a Malta summer home"
- "Why porcelain stoneware outperforms natural stone outdoors"
- "A Mediterranean bathroom: colours, formats, finishes"

Articles are intentionally content marketing — SEO anchors and agent-grounding material, not frivolous blog posts.

---

## 6. Definition of Done

- All routes listed above exist and resolve (real pages or clear placeholders) on staging
- 301 redirect map generated from seed + deployed at hosting level
- `sitemap.xml` auto-builds and includes every public route
- Canonical + OG tags verified on every page template (at least one test case per template type)
- JSON-LD validated via Google Rich Results Test
- Mobile nav keyboard-navigable top-to-bottom, Esc closes
- Footer nav link-check passes in CI (no 404s)

## 7. Open questions

- **Journal content strategy** — does The Tile have anyone who writes? Phase 1 ships 2-3 seed articles Claude Code writes from the brand voice guide. Ongoing cadence is a business decision — flag in the pitch that the journal is a lead-gen asset and monthly updates are the minimum viable cadence.
- **Showroom booking direct vs. form** — currently specced as Phase 2 integration. If The Tile is open to a Cal.com-style booking flow, that's a Phase 1 upgrade path worth mentioning in the pitch.
- **Brand pages depth** — is each supplier getting a full landing page, or a section of `/brands`? Current spec: full pages for the top 5-6 brands (Emilgroup, Ergon, Tagina, etc.), section-on-/brands for smaller suppliers. Final cut depends on available brand assets.
