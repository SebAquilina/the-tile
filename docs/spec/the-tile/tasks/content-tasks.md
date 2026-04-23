# Content Tasks

**For**: the implementer's content writer AND The Tile's team
**References**: all spec files, `seed/content.seed.json`

This track captures the content pieces that need writing, reviewing, and signing off — many of which need input from The Tile's team.

---

## From The Tile's team (information gathering)

Before build can fully complete, the implementer needs these answers from The Tile. Collect in the first week.

- [ ] **C-001** Confirm exact showroom address, opening hours, phone number, email, WhatsApp number
- [ ] **C-002** Confirm delivery terms — lead time for in-stock, lead time for Italy special order
- [ ] **C-003** Confirm returns policy — current practice on unopened vs. opened boxes
- [ ] **C-004** Confirm sample policy — free? returned? showroom-only?
- [ ] **C-005** Provide supplier-imagery licensing status — which catalogs are we permitted to use online?
- [ ] **C-006** Provide any existing logo / brand marks in vector form (SVG / AI / PDF)
- [ ] **C-007** Confirm supplier relationships — the 5 brands we've detected (Emilgroup, Emilceramica, Provenza, Ergon, Tagina) plus any others (Marca Corona, Rex, Florim, Viva, Keope, etc.). Flag any misattributions.
- [ ] **C-008** Approve the Italian-concierge voice direction — share the sample agent replies from `07-agent-system-prompt.md` and confirm tone
- [ ] **C-009** Confirm launch target date so the team can plan cutover

## Hand-written copy (implementer writes, The Tile signs off)

These need writing; they're not in the seed JSON.

- [ ] **C-010** **Home hero copy** — 60-80 words. Currently placeholder: "Italian stoneware. Chosen for Malta." Revise with The Tile's approval.
- [ ] **C-011** **About page** — 400-600 words. Starts from the scraped about text, rewritten in new voice. Covers: origin story since 1990, the curation philosophy, why Italian porcelain, the showroom experience, any team highlights.
- [ ] **C-012** **Showroom page** — 200-300 words. "What to expect when you visit" — warm, practical.
- [ ] **C-013** **Contact page** — short intro + all contact channels + form
- [ ] **C-014** **Brands page** intro — 100-150 words framing the supplier relationships
- [ ] **C-015** **Per-brand pages** — 2-3 sentences per brand covering heritage, specialties, the series we carry. 5 brands minimum from seed.
- [ ] **C-016** **Collection landing intros** — 60-100 words per effect (9 effects). Starts from the `summary` field in `seed/products.seed.json > categories`, expanded into full paragraphs.
- [ ] **C-017** **Product detail descriptions** — each of the 60 tiles gets a 80-150 word description. Starts from the scraped description in `products.seed.json`, enriched with best-for context and Italian-concierge voice.
- [ ] **C-018** **Journal seed articles** — write 2-3 for launch:
  - *"Choosing marble-effect tiles for a Malta summer home"* (800-1200 words, SEO for "marble tiles malta")
  - *"Why porcelain stoneware outperforms natural stone outdoors"* (600-1000 words)
  - *"A Mediterranean bathroom: colours, formats, finishes"* (800-1200 words)
- [ ] **C-019** **Legal pages** — privacy, terms, cookies. Start from a GDPR-compliant template for a Malta-based business, customised for The Tile's data practices.
- [ ] **C-020** **Agent starter-chip copy** — the 4 chips on the hero. Current specced: "warm floor for a living room" / "bathroom, something calm" / "outdoor patio tile" / "surprise me". Confirm with The Tile's owner — they may have better guesses at what their customers actually ask.
- [ ] **C-021** **Contact form labels + placeholders** — project notes placeholder ("briefly describe the room you're working on…"), consent copy, success/error messages
- [ ] **C-022** **Email template copy** — the lead-notification email sent to the shop inbox (`04-backend-spec.md §6`)
- [ ] **C-023** **Error-state microcopy** — 404, 500, network error, agent-offline
- [ ] **C-024** **Cookie consent modal copy** — GDPR-compliant, specific to what we do/don't collect

## Imagery

- [ ] **C-025** **Hero tile photography** — once licensing confirmed (C-005), select 3-5 hero images from supplier catalogs. Fallback: commission photography of showroom tiles (Phase 2).
- [ ] **C-026** **Per-product imagery** — for each of 60 tiles, at least 1 primary image. Fallback: text-first cards with a graphic placeholder for Phase 1.
- [ ] **C-027** **Showroom photography** — 2-3 showroom images for the /showroom page. Fallback: atmospheric placeholder; commission in Phase 2.
- [ ] **C-028** **OG social card image** — single site-wide fallback, 1200×630. Design in the brand style.

## Sign-off

- [ ] **C-029** The Tile's owner reviews staging site end-to-end before launch — content, voice, imagery, functionality
- [ ] **C-030** Legal review of privacy + terms pages by The Tile's solicitor if available
- [ ] **C-031** At least 5 staff at The Tile use the agent on staging for 1 day, feedback incorporated

---

**Total estimate**: 4-6 working days of writing + 2 weeks of back-and-forth with The Tile for info gathering and sign-off. The writing and The Tile's review happen in parallel with build, not sequentially.

## Content sources prioritised

1. **Scraped from `seed/content.seed.json`** — about intro, contact paragraphs, home tagline. Start here.
2. **Generated from `seed/products.seed.json`** — product summaries, category descriptions. Already structured.
3. **Hand-written by implementer** — brand heritage, journal articles, voice-forward rewrites of scraped copy, legal pages, microcopy.
4. **Provided by The Tile** — exact contact info, delivery terms, returns policy, supplier agreements.
