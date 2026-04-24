# The Tile — spec directory

Agent-first website rebuild for The Tile (Malta), specced for Claude Code to implement verbatim.

---

## For Seb (the pitch author)

**What this is**: the complete implementation spec for the rebuild you're pitching. 18 files, ~5,700 lines, every decision locked.

**How to use it in the pitch meeting**:

1. **Open with `BLUEPRINT.md`** — the Charter table on page 1 is the pitch summary. Walk The Tile through the locked decisions and what makes this different ("agent-first", "Italian-concierge voice", "quote-driven" section).
2. **The scraped catalog is the trust move** — show them `seed/products.seed.json`. 60 of their tiles, pre-classified across 8 effects. You've done the fact-finding; they don't have to give you a catalog before you start.
3. **The agent hero is the signature** — `05-agent-spec.md §2` describes the full-viewport greeting. Nothing else in Malta looks like this. Use it as the visual centerpiece of the pitch.
4. **The cost estimate is the closer** — `09-deploy-plan.md §9`: €12-15/month to run at this scale, vs. what they're paying Weebly + invisible SEO costs. Hosting is a non-issue.
5. **The timeline is credible** — 4-6 weeks solo build, or 3-6 hours via Claude Managed Agents (Agent Teams). Either way, this ships before summer.

**Deliverables beyond the website itself** (mention in the pitch):
- 30 days of post-launch support
- Team handbook + runbook docs (in `09-deploy-plan.md §8`)
- A GitHub-based content edit flow that lets The Tile add new tiles without a dev
- Phase 2 roadmap: Maltese/Italian translations, showroom booking, photography, admin UI

**Open questions flagged for the client** (all in `BLUEPRINT.md §Open questions`):
- Supplier imagery licensing (blocker for final imagery)
- Returns + delivery policy confirmation
- Journal editorial ownership

---

## For the implementation agent (Claude Code, Agent Teams, or human dev)

**Read order**:

1. `BLUEPRINT.md` — the locked Charter and build order
2. `01-design-system.md` — tokens anchor everything
3. `02-information-architecture.md` — URL + page map + redirect map
4. Then parallel tracks:
   - Frontend: `03-frontend-spec.md` + `tasks/frontend-tasks.md`
   - Backend: `04-backend-spec.md` + `tasks/backend-tasks.md`
   - Agent: `05-agent-spec.md` + `06-site-knowledge.md` + `07-agent-system-prompt.md` + `tasks/agent-tasks.md`
   - Content: `tasks/content-tasks.md`
   - Deploy: `09-deploy-plan.md`
5. Gate against `10-qa-checklist.md` at every milestone
6. Data from `seed/*.seed.json` (60 products, 5 brands, content)

**Rules for the build**:
- Every spec file is production-grade. No "v1 scope" hedges.
- Seed JSON is the source of truth for catalog data — the D1 `products` table is a cache.
- When in doubt, the four guiding principles in `01-design-system.md §1` win.
- Contradictions: `BLUEPRINT.md` wins over sibling files. Flag any contradictions in PR.

**Running Agent Teams** (if Seb picks this path):
- Coordinator: Opus 4.7
- Five parallel Sonnet 4.6 agents: design, frontend, backend, agent, deploy
- Mount this whole spec directory as shared context
- See `09-deploy-plan.md §10` for the full recipe

---

## File inventory

```
spec/the-tile/
├── README.md                         ← you are here
├── BLUEPRINT.md                      ← master index, locked Charter
├── 01-design-system.md               ← tokens, components, voice anchors
├── 02-information-architecture.md    ← URLs, nav, redirect map, SEO
├── 03-frontend-spec.md               ← Next.js 14 stack, components, budgets
├── 04-backend-spec.md                ← CF Pages + D1 + Gemini proxy + Resend
├── 05-agent-spec.md                  ← agent behaviour, capabilities, tests
├── 06-site-knowledge.md              ← generated grounding (42K chars, 60 tiles detailed)
├── 07-agent-system-prompt.md         ← populated Gemini system prompt
├── 08-product-schema.json            ← JSON Schema for tile data
├── 09-deploy-plan.md                 ← GitHub + CF + CI/CD + runbook
├── 10-qa-checklist.md                ← 5-gate launch checklist
├── seed/
│   ├── products.seed.json            ← 60 tiles across 8 effects
│   ├── brands.seed.json              ← 5 Italian suppliers
│   └── content.seed.json             ← about, contact, home from scrape
└── tasks/
    ├── frontend-tasks.md             ← F-001 to F-068, sequenced
    ├── backend-tasks.md              ← B-001 to B-035
    ├── agent-tasks.md                ← A-001 to A-031
    └── content-tasks.md              ← C-001 to C-031, includes asks for The Tile
```

---

## Data summary

From the scrape of the-tile.com (78 pages, April 2026):

- **60 tile collections** classified into 8 effect categories:
  - Stone: 18 · Wood: 11 · Marble: 10 · Concrete: 8 · Slate: 5 · Terrazzo: 4 · Full-Colour: 2 · Terracotta: 2
- **5 supplier brands** detected: Emilgroup, Emilceramica, Ergon, Provenza, Tagina (more likely exist; confirm with client)
- **3 cross-cutting usage categories**: bathroom, outdoor-paving, paving-20mm
- **All 60 tiles** have: name, slug, effect, brand (where detected), summary, description, tags, best-for, source URL

The spec handles categories with zero or few products (gesso, outdoor-paving, 20mm, bathroom as its own category) as Phase 2 re-scrape items — flagged throughout.

---

## Cost + timeline snapshot

| Item | Value |
|---|---|
| Build timeline (solo senior dev) | 4-6 weeks |
| Build timeline (Agent Teams parallel) | 3-6 hours working time + supervision |
| Build token cost (Agent Teams) | ≈ $20-60 + $2-5 session-hour surcharges |
| Monthly operational cost | ≈ €12-15 (CF free tier + Plausible + domain + Gemini ~€2) |
| Gemini cost per 1K agent conversations | ≈ €1-2 |

---

Spec generated by the `agent-first-website` skill, April 23, 2026.
