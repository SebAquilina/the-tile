# BLUEPRINT — The Tile, agent-first rebuild

**Status**: Specification — ready for build
**Client**: The Tile (Malta) · San Gwann, since 1990
**Scope**: Full website rebuild, agent-first architecture, production launch
**Version**: v1 · 2026-04-23

This document is the entry point. Every specific decision lives in a sibling file; this blueprint gives the implementation agent (Claude Code or similar) the overall shape and build order, plus the locked Charter.

---

## Quick read (for the impatient implementation agent)

Build order:
1. Read this file end to end
2. Read **`01-design-system.md`** — the tokens anchor everything
3. Read **`02-information-architecture.md`** — the URL + page map
4. Then parallel tracks:
   - Frontend track: `03-frontend-spec.md`
   - Backend track: `04-backend-spec.md`
   - Agent track: `05-agent-spec.md` + `06-site-knowledge.md` + `07-agent-system-prompt.md`
   - Deploy track: `09-deploy-plan.md`
5. Validate against **`10-qa-checklist.md`** at every milestone
6. Data to load from **`seed/*.seed.json`** (all 60 products, 5 brands, content)
7. Task lists per track in **`tasks/*.md`**

If anything in a sibling file contradicts this blueprint, **this blueprint wins**. Flag the contradiction in the PR.

---

## Charter (locked)

| Field | Value |
|---|---|
| **Client** | The Tile — porcelain stoneware retailer, San Gwann Malta, since 1990 |
| **Project scope** | Paid-build pitch, then production delivery. Full website rebuild replacing current Weebly site at the-tile.com. |
| **Reference site** | https://www.the-tile.com (scraped 2026-04-23, 78 pages, data in `seed/`) |
| **Primary conversion goal** | Visit showroom / request quote. Brochure-modern feel — no e-commerce checkout. |
| **Voice archetype** | Design-forward Italian concierge — sophisticated, leans into the Italian heritage (Emilgroup, Ergon, Tagina, Marca Corona) |
| **Agent greeting mode** | Full-screen hero "What are you looking for?" with `[just let me browse]` fallback. Maximum agent-first signal. |
| **Catalog update cadence** | Rare (<1/month) — seed JSON edits + GitHub commit triggers rebuild |
| **User accounts** | None Phase 1 |
| **Payments** | None Phase 1 (quote-driven) |
| **Regulation** | GDPR (Malta = EU). Cookieless analytics, explicit consent on optional items only. |
| **Hosting** | Cloudflare Pages + Pages Functions + D1 + Turnstile |
| **Database** | Cloudflare D1 (SQLite at edge) |
| **LLM** | Gemini 3.1 Flash-Lite (upgradable via env var to 3.1 Pro) |
| **Email** | Resend |
| **Domain** | the-tile.com (cutover from Weebly) |
| **Primary nav axis** | "Effect" categorisation (Marble, Wood, Stone, Slate, Concrete, Terrazzo, Terracotta, Gesso, Full-Colour) — 9 effects, 60 tiles |
| **Secondary categorisation** | Usage (bathroom, outdoor-paving, paving-20mm) as cross-cutting tags |
| **Showroom booking** | Phase 1 = contact form with date preference; Phase 2 = Cal.com integration |
| **Languages** | English only Phase 1; Maltese + Italian Phase 2 |
| **Bot protection** | Cloudflare Turnstile on contact form + first agent message |
| **Analytics** | Plausible (cookieless) |
| **Error monitoring** | Sentry |

---

## The four guiding principles

Repeat of `01-design-system.md §1`, applied to every decision:

1. **The tile is the hero, not the interface.**
2. **Italian editorial, not e-commerce.**
3. **Type does the heavy lifting** — no decorative illustration, motion, or chrome.
4. **Agent-first confidence** — the chat owns first load.

When the implementation agent is unsure about a call, it resolves by returning here.

---

## Spec documents — the full index

| File | Purpose | Audience |
|---|---|---|
| **BLUEPRINT.md** (this file) | Entry point, locked Charter, build order, guiding principles, open questions rollup | Everyone |
| `01-design-system.md` | Palette, typography, spacing, radius, shadow, motion, component inventory, voice anchors | Design + Frontend |
| `02-information-architecture.md` | Site map, navigation, URL conventions, redirect map, SEO structure | Frontend + SEO |
| `03-frontend-spec.md` | Stack (Next.js 14 App Router), project layout, component acceptance criteria, build sequence, perf + a11y budgets | Frontend |
| `04-backend-spec.md` | CF Pages Functions, D1 schema with SQL, API routes, Gemini proxy deep-spec, Resend + Turnstile integration, env vars | Backend |
| `05-agent-spec.md` | Model config, greeting flow, capabilities, grounding, navigation directive contract, safety rules, 20-test dialog suite, quality gates | Agent implementer |
| `06-site-knowledge.md` | Generated from seed — full catalog (60 tiles), brands, policies, voice guide, out-of-scope rules. **Grounds the agent.** | Agent implementer (auto-regenerated) |
| `07-agent-system-prompt.md` | The populated Gemini system prompt with full navigation contract, refusal patterns, runtime assembly instructions | Agent implementer |
| `08-product-schema.json` | JSON Schema for tile products — all fields including tile-specific attributes (formats, finishes, thicknesses, slipRating, waterAbsorption) | Backend + content pipeline |
| `09-deploy-plan.md` | GitHub org + branches, CF Pages + D1 config, wrangler.toml, 3 GitHub Actions workflows, secrets inventory + rotation, runbook outlines, cost estimate | Deploy + DevOps |
| `10-qa-checklist.md` | 5-gate launch checklist — build, design/a11y, performance, agent quality, operations/launch | QA + project lead |
| `seed/products.seed.json` | All 60 tiles with effect, brand, summary, description, tags, usage, best-for | Build pipeline |
| `seed/brands.seed.json` | 5 supplier brands with logos where scraped | Build pipeline |
| `seed/content.seed.json` | About, contact, home copy from scrape | Build pipeline |
| `tasks/frontend-tasks.md` | Sequenced frontend task list | Frontend implementer |
| `tasks/backend-tasks.md` | Sequenced backend task list | Backend implementer |
| `tasks/agent-tasks.md` | Sequenced agent task list | Agent implementer |
| `tasks/content-tasks.md` | Content writing + sign-off task list | Content owner + The Tile |

---

## What makes this different from a normal website rebuild

### 1. Agent-first architecture

The AI concierge is the home page. Not a chat bubble in the corner. Not a sidebar. The full viewport.

The rationale: tile shopping is a discovery problem. Most visitors arrive with vague intent ("I want something warm for the kitchen"). Traditional catalogs require them to filter their way to an answer — which is hard when you don't know the vocabulary. An agent that asks "what are you looking for?" meets them where they are.

This is the signature move. Every visual and technical choice supports it.

### 2. Thirty years of curation as the competitive edge

The Tile's advantage over a commodity competitor isn't inventory — it's taste. Thirty years of choosing which Italian collections are worth carrying. The agent surfaces this.

Instead of "here are 600 options, good luck," the agent says "for a calm bathroom, I'd look at these three." That's the business.

### 3. Quote-driven, not cart-driven

The Tile sells by relationship. The website's job is to warm a lead into a showroom visit or a quote request, not to process a transaction. Everything flows toward that — the agent recommends, the save-list shortlists, the contact form submits a qualified lead to the shop inbox.

No cart. No checkout. No account. No friction for the business model that actually works.

### 4. Data ships with the spec

Every tile in the catalog is already in `seed/products.seed.json`. The agent's grounding is already generated. The redirect map is already computed. The implementation agent isn't doing fact-finding — it's building.

---

## Phased delivery

### Phase 1 — Launch (this spec)

Everything above. Timeline estimate for a competent team (1 senior full-stack dev + design review): **4-6 weeks** from kickoff to launch.

### Phase 2 — Enrichment (3-6 months post-launch)

- Maltese + Italian translations
- Commissioned showroom photography
- Cal.com-style showroom booking
- Lightweight admin UI for non-technical edits
- R2 image hosting with on-the-fly resize
- Journal content cadence established

### Phase 3 — Optimisation (6-12 months)

- WhatsApp Business API integration (in-admin replies)
- Product sample request flow separate from quote
- A/B testing agent starter-chips copy
- Seasonal campaign templates
- Customer reviews collection (if The Tile wants them)

---

## Success criteria

At 30 days post-launch:

| Metric | Target | Measurement |
|---|---|---|
| Lead submissions | Baseline-positive vs Weebly (TBD number) | D1 lead count |
| Agent engagement | ≥ 25% of visitors open the agent panel | Plausible custom event |
| Agent-to-lead conversion | ≥ 10% of agent conversations reach `submit-lead` | Plausible funnel |
| Lighthouse perf | ≥ 90 mobile on home + catalog | Lighthouse CI |
| Hallucination rate | 0 invented tile names / brands | Human review of 100 conversations |
| Sentry errors | < 0.5% of requests | Sentry dashboard |

At 90 days: meaningfully higher lead volume vs the Weebly baseline, and at least one "this is different" comment from a customer or trade partner.

---

## Open questions — rolled up across the spec

Flagged for The Tile's team or follow-up:

### Business-facing (for The Tile to answer)

- **Supplier photography licensing** — which catalog imagery can we use on the web? (Design + Frontend blocked until answered.)
- **Showroom commissioned photography** — commission now or defer to Phase 2? (Recommendation: defer.)
- **Returns policy** — confirm the 14-day unopened return policy as the actual standard.
- **Delivery lead times** — confirm 1-3 working days (stock) vs 4-8 weeks (Italy special order) or adjust.
- **Showroom hours** — populate from contact page scrape, confirm with team.
- **Phone + WhatsApp numbers** — populate from contact page scrape, confirm.
- **Journal editorial ownership** — does someone at The Tile write, or does the implementer write and they sign off?
- **Brand heritage copy** — 2-3 sentences per supplier (Emilgroup, Emilceramica, etc.) — sourced from brand public info or written fresh?

### Strategic (for pitch discussion)

- **Branding refresh** — keep the current THE TILE logo or refresh? Phase 1 launches with current; Phase 2 option is a light wordmark polish.
- **Content budget** — Phase 1 ships 2-3 seed articles. Ongoing cadence is a business decision; recommend minimum 1/month.
- **Post-launch support** — 30 days included; beyond that is a separate retainer.

### Technical (for implementer)

- **ISR revalidation cadence** — specced as 60s for collections, 300s for journal. Tunable.
- **Mobile agent panel height** — full-screen vs 70%. Specced as full-screen; test post-launch.
- **Starter-chip copy on hero** — specced; A/B candidates for post-launch.
- **`surprise me` agent behaviour** — define the curation heuristic with The Tile's owner.
- **Admin UI Phase 2 scope** — define what non-technical edits matter most (new tile, mark out-of-stock, update about page).

---

## Handover

This spec directory is the handoff deliverable. Copy it verbatim into the project repo under `docs/spec/` before build starts — every future change to the spec is a git commit that the build reads from.

Implementation agent opens this file, reads the sibling files in dependency order, and builds. Any question it can't answer from here is flagged as an open question for the human.

When the build is complete, `10-qa-checklist.md` is the sign-off document. Launch happens when all 5 gates are green.

---

## Credits

Spec produced by the `agent-first-website` skill. Scraped the-tile.com, classified 60 products across 8 effects, generated agent grounding, and locked decisions based on an intake interview with the project owner.

Build estimate: 4-6 weeks solo senior full-stack, or 3-6 hours via Claude Managed Agents / Agent Teams (coordinator + 5 parallel workers).

Operational estimate: ≈ €12-15/month hosting (Cloudflare free tier + Plausible + domain renewal + Gemini inference).
