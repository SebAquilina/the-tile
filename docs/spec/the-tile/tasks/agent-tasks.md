# Agent Tasks

**For**: implementation agent working on the AI concierge
**References**: `05-agent-spec.md`, `06-site-knowledge.md`, `07-agent-system-prompt.md`

This track owns the agent's brain + UI + evaluation. Depends on frontend primitives (`F-010` to `F-021`) and backend API scaffolding (`B-009`, `B-014`).

---

## Prompt & context (1 day)

- [ ] **A-001** Copy `07-agent-system-prompt.md`'s code block content into a build-time constant. Write `scripts/build-agent-context.ts` that:
  - Reads `07-agent-system-prompt.md`, extracts the fenced code block
  - Reads `06-site-knowledge.md` (the generated one)
  - Concatenates with a `\n\nSITE KNOWLEDGE:\n` separator
  - Writes to `apps/web/lib/agent-system-prompt.ts` as `export const AGENT_SYSTEM_PROMPT = "..."`
- [ ] **A-002** Verify built prompt token count via a quick tiktoken-equivalent estimate — should be 12-15K tokens
- [ ] **A-003** Set up `GEMINI_API_KEY` in staging CF env, test a raw `curl` to Gemini 3.1 Flash-Lite streaming endpoint with the full prompt
- [ ] **A-004** Verify that action-trailer emission works reliably at `temperature: 0.5` — manually test 20 varied user inputs, confirm ≥ 90% emit well-formed trailers when actions are appropriate

## Site-knowledge regeneration (0.5 day)

- [ ] **A-005** Port `generate_knowledge.py` logic from the spec into TypeScript: `scripts/generate-site-knowledge.ts`. Reads seed JSON, writes updated `apps/web/data/site-knowledge.md`.
- [ ] **A-006** Add pre-commit hook or CI job (the `sync-kb.yml` workflow from `09-deploy-plan.md §5`) that regenerates site-knowledge on seed changes and commits the diff
- [ ] **A-007** Verify regeneration idempotency — running twice produces the same output

## API handler (parallel with B-015)

- [ ] **A-008** Implement `app/api/agent/chat/route.ts` per `04-backend-spec.md §4`. Edge runtime.
- [ ] **A-009** Stream Gemini response to client using `text/event-stream`
- [ ] **A-010** Parse action trailer server-side first (optional — client parses too, but server parse lets us log structured data)
- [ ] **A-011** Log per-turn: session ID, turn number, latency, tokens, actions emitted
- [ ] **A-012** Token-cap enforcement with polite-fallback response

## Frontend agent UI (parallel with F-035 to F-041)

- [ ] **A-013** `lib/agent-client.ts` — handles request construction (including session cookie / ID), SSE parsing, action-trailer extraction, error handling
- [ ] **A-014** `components/agent/AgentHero.tsx` — full-viewport greeting per `05-agent-spec.md §2`. Autofocus input on mount (skip if `prefers-reduced-motion` AND returning user).
- [ ] **A-015** `components/agent/AgentPanel.tsx` — side-panel (desktop) + full-sheet (mobile). Streaming text render (show tokens as they arrive). Blinking caret during active stream. Markdown render via `react-markdown` + `rehype-sanitize`.
- [ ] **A-016** `components/agent/AgentBubble.tsx` — floating FAB, 56px, brand-umber
- [ ] **A-017** `components/agent/ActionReceipt.tsx` — inline confirmations per `05-agent-spec.md §4`
- [ ] **A-018** Morph animation: AgentHero → AgentPanel transition via shared layout element (Framer Motion optional; CSS transition on `max-width` + `transform` can handle it cleanly)
- [ ] **A-019** Event bus wiring: `filter` → FilterBar updates, `navigate` → router.push, `highlight-products` → catalog flash animation, `add-to-save-list` → SaveList dispatch, `submit-lead` → calls `/api/contact`, `escalate` → opens appropriate UI
- [ ] **A-020** Session cookie: random ID generated client-side, sent with every `/api/agent/chat` request, stored in HttpOnly cookie by the API on first response

## Safety + quality (2 days)

- [ ] **A-021** Build the 20-dialog test suite from `05-agent-spec.md §8` — `apps/web/tests/agent/dialogs.test.ts`. Each dialog is a Vitest or Playwright-integrated test with assertions: "response contains tile name X", "action emitted Y", "no invented brands".
- [ ] **A-022** Hallucination guard-test: script that asks for 10 invented tile names, asserts agent admits not knowing rather than inventing. Run in CI.
- [ ] **A-023** Jailbreak guard-test: 5 adversarial prompts, all must produce polite refusals.
- [ ] **A-024** Long-context test: 15-turn conversation, assert final state includes `submit-lead` action with consent evidence in the conversation text.
- [ ] **A-025** Human review protocol: instructions for reviewing 100 real conversations post-staging-pilot. Template a feedback form with hallucination, tone, correctness columns.

## Observability (0.5 day)

- [ ] **A-026** Plausible custom events: `agent.opened`, `agent.message_sent`, `agent.action_emitted` (with action type), `agent.lead_submitted`
- [ ] **A-027** Sentry: instrument agent-client and API route, flag Gemini API failures, surface rate-limit rejections as warnings (not errors)
- [ ] **A-028** Daily digest script (optional Phase 2): summarises agent token burn, error rate, lead submissions

## Documentation (0.5 day)

- [ ] **A-029** `docs/runbook/gemini-outage.md` — what happens, how to verify, fallback UX
- [ ] **A-030** `docs/team-handbook.md` — "how the concierge works" section for The Tile team (non-technical)
- [ ] **A-031** Update README with quickstart: how to run locally with a Gemini API key

---

**Total estimate**: 5-6 working days after prereqs complete. Agent work benefits from a tight loop — build, test, adjust prompt, retest.

## Key files this track owns

```
apps/web/
├── lib/
│   ├── agent-client.ts
│   ├── agent-system-prompt.ts  (generated)
│   └── events.ts
├── components/agent/
│   ├── AgentHero.tsx
│   ├── AgentPanel.tsx
│   ├── AgentBubble.tsx
│   └── ActionReceipt.tsx
├── app/api/agent/chat/route.ts
├── data/site-knowledge.md  (generated)
└── tests/agent/
    └── dialogs.test.ts

scripts/
├── build-agent-context.ts
└── generate-site-knowledge.ts
```
