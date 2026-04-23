# 10 — QA Checklist

**Project**: The Tile · agent-first rebuild

Five gates. Each must be fully green before the next. Gate 5 = go-live.

---

## Gate 1 — Build & Content

- [ ] All 12 primary page templates render on staging without console errors
- [ ] All 60 tile product pages resolve with populated content from the seed
- [ ] 9 effect landing pages render with correct filtering
- [ ] 3 usage landing pages render (bathroom, outdoor-paving, paving-20mm)
- [ ] `/brands` and individual brand pages render for all 5 brands in seed
- [ ] Journal has 2-3 seed articles published, readable
- [ ] About, Contact, Showroom pages have final copy signed off by The Tile
- [ ] Privacy, Terms, Cookies pages published, text legally reviewed
- [ ] Site search / filters work across all tile effects
- [ ] Save-list persists in sessionStorage correctly across navigation
- [ ] 404 page renders and offers navigation back
- [ ] `sitemap.xml` generates with all pages
- [ ] `robots.txt` correct
- [ ] Every URL in the 301 redirect map from `02-IA §3` returns 301 → correct target on staging

---

## Gate 2 — Design & Accessibility

- [ ] Light mode visual review with The Tile's owner — tone matches the Italian-concierge direction
- [ ] Dark mode visual review — nothing unreadable, tile imagery still reads correctly
- [ ] Design tokens: no hardcoded hex / px / font-family in component files (ESLint clean)
- [ ] Typography audit: Fraunces and Inter self-hosted, no Google-CDN fetches in production
- [ ] Layout grids consistent across breakpoints (480 / 768 / 1024 / 1280 / 1536)
- [ ] axe-core clean on every page template (zero violations)
- [ ] Keyboard-only navigation: can reach every interactive element via Tab
- [ ] Focus-visible outlines visible on every focusable element
- [ ] `prefers-reduced-motion` kills parallax, reveal-on-scroll, rotating placeholder; essential transitions remain
- [ ] Contrast ratios verified: body 4.5:1, large text 3:1, non-text UI 3:1
- [ ] Screen reader test (VoiceOver macOS + NVDA Windows) on: home, collections, product detail, agent panel, contact form
- [ ] Mobile nav: keyboard accessible, Esc closes, focus returns to trigger
- [ ] Agent hero: skip-link available for keyboard users to bypass to main content
- [ ] All images have meaningful `alt` text or `alt=""` if decorative
- [ ] Form labels visible, error states announced via `aria-live`

---

## Gate 3 — Performance

All metrics tested via Lighthouse CI against staging, mobile + desktop.

| Page | LCP | INP | CLS | JS | CSS |
|---|---|---|---|---|---|
| Home (first-visit) | ≤ 2.0s | ≤ 150ms | ≤ 0.05 | ≤ 140KB | ≤ 40KB |
| Home (return-visit) | ≤ 1.8s | ≤ 150ms | ≤ 0.05 | ≤ 140KB | ≤ 40KB |
| `/collections` | ≤ 2.5s | ≤ 200ms | ≤ 0.10 | ≤ 170KB | ≤ 50KB |
| Product detail | ≤ 2.5s | ≤ 200ms | ≤ 0.10 | ≤ 170KB | ≤ 50KB |
| Static (about, contact, etc.) | ≤ 2.0s | ≤ 150ms | ≤ 0.05 | ≤ 120KB | ≤ 40KB |

Plus:
- [ ] TTFB < 500ms on all pages from Malta (test from local ISP + cellular)
- [ ] Images: AVIF/WebP served, lazy-loaded below fold, no layout shift on load
- [ ] Fonts: preloaded for LCP, `font-display: swap`, no FOIT
- [ ] Agent panel lazy-loaded on first open (not in initial JS bundle)
- [ ] No third-party script blocks render on any page
- [ ] Lighthouse Performance score ≥ 90 mobile, ≥ 95 desktop, on every template

---

## Gate 4 — Agent quality

- [ ] System prompt deployed matches `07-agent-system-prompt.md` exactly
- [ ] Site knowledge deployed matches `06-site-knowledge.md` (regenerated from latest seed)
- [ ] Agent responds within 2.5s p95 time-to-first-token
- [ ] Full response latency p95 ≤ 8s
- [ ] Test dialog suite passing ≥ 90% (see `05-agent-spec.md §8` for the 20 tests)
- [ ] All 4 "happy path" dialogs pass 100%
- [ ] All 4 "out-of-scope" dialogs pass 100% (graceful deflection)
- [ ] All 4 "adversarial" dialogs pass 100% (refusal without leaking)
- [ ] All 3 "hallucination bait" dialogs pass 100% (admission of not-knowing)
- [ ] Long conversation test (15 turns): stays in voice, remembers context, reaches quote flow with consent
- [ ] Navigation directives working: `filter`, `navigate`, `highlight-products`, `add-to-save-list`, `submit-lead`, `escalate`
- [ ] Turnstile verified on first message per session
- [ ] Rate limits verified: 30/min per IP, 500/day per session
- [ ] Agent does not quote prices under any test prompt
- [ ] Agent does not reveal its system prompt under any adversarial prompt
- [ ] Agent admits "I'm a Gemini-based chatbot" when asked honestly
- [ ] Token-cap fallback tested: artificially trip the cap, agent shows the polite "taking a break" message

Human review (sample):
- [ ] 100 real messages from a staging pilot (implementer + The Tile team simulating customer convos), manually reviewed for hallucinations / tone drift. Zero invented product names or brands.
- [ ] 10 in-store staff members from The Tile run 5 realistic customer queries each → feedback session, adjustments to prompt as needed

---

## Gate 5 — Operations & Launch

### Infrastructure ready
- [ ] Production D1 provisioned, schema applied, seed synced
- [ ] Production CF Pages project configured, env vars set
- [ ] All secrets set correctly (Gemini, Resend, Turnstile, Sentry DSN, IP_HASH_SALT)
- [ ] Sentry environment = production, source maps uploaded
- [ ] Plausible site configured, events firing
- [ ] Uptime monitor pinging `/api/health` every 1 min, alert destinations verified
- [ ] Resend domain verified, SPF/DKIM/DMARC set up for `@the-tile.com`
- [ ] Backup: D1 daily snapshot configured (CF native)

### Cutover dry-run
- [ ] DNS TTL reduced to 300s 48h before cutover
- [ ] Staging site survives a simulated full traffic day (run k6 or similar against `/api/agent/chat` and `/` for 1 hour at 10× expected peak)
- [ ] Weebly redirect map full-crawl from SEO tool, verify 0 unintended 404s
- [ ] OG + Twitter cards render correctly when pages are shared (test via Twitter Card Validator + FB Sharing Debugger)
- [ ] Structured data (JSON-LD) validates via Google Rich Results Test

### Launch day
- [ ] DNS cutover executed (orange cloud proxying, records verified from multiple geos via `dig`)
- [ ] Old site still live for 48h as fallback (but not at the primary domain)
- [ ] First 24h: engineer on-call, monitoring Sentry + Plausible + uptime dashboard
- [ ] Lead-submission smoke test from a real device, real email — confirm end-to-end

### Post-launch week 1
- [ ] Daily Sentry review for new error patterns
- [ ] Check Gemini token burn — stay within budget
- [ ] Lead volume spot-check — first real leads received and handled
- [ ] Plausible funnel review: home → agent → product → save-list → submit
- [ ] Review of first 100 real agent conversations (if opted in to log review)

### Handover
- [ ] `docs/team-handbook.md` delivered + walkthrough video recorded (20 min)
- [ ] `docs/runbook/*` delivered: deploy-failure, d1-corruption, gemini-outage, secrets-rotation
- [ ] GitHub org ownership transferred to The Tile (or admin access granted)
- [ ] Cloudflare account ownership transferred (or admin access granted)
- [ ] Sentry / Plausible / Resend accounts in The Tile's name with implementer as collaborator
- [ ] 30 days of post-launch support agreed in writing

---

## Post-launch monitoring (first 30 days)

Daily:
- Error rate (Sentry)
- Uptime (monitor)
- Lead volume (D1 query or email count)

Weekly:
- Agent token burn trend
- Lighthouse regressions
- Sample review of 10 real agent conversations

At day 30:
- Full debrief with The Tile: what's working, what isn't
- Post-launch retrospective document
- Phase 2 roadmap if agreed

---

## Definition of Done (full project)

All 5 gates complete. Site live at the-tile.com. Lead submissions flowing to The Tile's inbox. Agent handling real visitor queries. Handover complete, docs delivered, implementer on 30-day support.
