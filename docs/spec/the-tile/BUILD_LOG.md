# BUILD_LOG — the-tile

Retrospective record of decisions taken during the v1 build, plus the v2 retrofit additions. Cowork (or you, manually) appends to this file going forward — every default-decision the operator takes during build gets logged here so the client can review post-launch and change anything they don't like.

> ⚠ **No paid action below was taken without explicit user confirmation. Domain renewal, paid plans, broadcast emails — none of them executed without a per-action "yes." This log is auditable.**

---

## v1 build — what shipped initially

| Date | Decision | Rationale | Reversible? |
|---|---|---|---|
| 2026-04-24 | Cloudflare Pages on free tier | Sufficient for projected traffic; matches deploy plan | ✅ Yes — upgrade is a paid-action confirm |
| 2026-04-24 | D1 free tier (5M reads, 100k writes/day) | Catalog scale fits comfortably | ✅ Yes — upgrade is a paid-action confirm |
| 2026-04-24 | Resend free tier | 100/day covers contact form + light transactional | ✅ Yes — Pro is $20/mo, paid-action confirm |
| 2026-04-24 | Gemini Flash-Lite for the agent | Cheap, fast, good enough for grounded Q&A | ✅ Yes — can swap to Pro Gemini at higher token rates |
| 2026-04-24 | Single-user admin (Basic Auth) | v1 scope; multi-user is v2 | ✅ Yes — v2 admin replaces it |
| 2026-04-24 | `ADMIN_USER` / `ADMIN_PASSWORD` set as env vars | Standard pattern; works with middleware | ✅ Yes — with redeploy (BUILD_TIME-inlined) |
| 2026-04-24 | Custom domain `the-tile.com` | Operator's existing domain | ✅ Yes — transfer to client at handoff |
| 2026-04-24 | English only | Charter said so | ✅ Yes — agent system supports multi-lang via prompt setting |
| 2026-04-24 | No checkout | the-tile sells through showroom; no e-comm v1 | ✅ Yes — Stripe + checkout flow is v2 if needed |
| 2026-04-24 | Sentry free tier | 5k errors/mo plenty for a small site | ✅ Yes — paid is $26/mo, paid-action confirm |
| 2026-04-24 | No analytics yet (`lib/analytics.ts` is a stub) | Plausible at $9/mo is paid; deferred until needed | ✅ Yes — toggle when needed, paid-action confirm |
| 2026-04-24 | Bot protection via CF Turnstile | Spam-resistant contact form | ⚠ Token lacked scope; widget creation needs CF UI step |
| 2026-04-24 | Issue #2 opened with deploy runbook | Ongoing reference | ✅ Yes |

---

## Issues hit during v1 build (and what was learned)

| Issue | Root cause | Fix in v2 retrofit |
|---|---|---|
| `deploy.yml` failed on every push, 0 jobs | `secrets.X` referenced in step-level `if:` — invalid in GitHub Actions | `actionlint` in CI; fixed `deploy.yml` in retrofit (`v2-retrofit/.github/workflows/deploy.yml`) |
| `bba2b126.../admin` returned 401 even with new creds | Next.js Edge middleware inlines `process.env.X` at build time; CF dashboard env-var changes don't propagate to existing deployments | Documented in the spec; `gate-6-envvar-mode.sh` catches drift; `gate-5-admin-auth.sh` validates live |
| `GITHUB_TOKEN` initially saved as Plaintext, not Secret | UI-driven manual entry is error-prone | Cowork generates tokens with correct type via Chrome MCP; never asks user to click |
| `www.the-tile.com/admin` returned 404 | Custom domain not fully wired to Pages project | `gate-0-reachability.sh` catches this end-to-end |
| GitHub PAT lacked Issues scope | Default fine-grained scope is Contents only | `pat-scopes.md` lists exact required scopes; Cowork verifies each scope after creation |
| CF Pages `+ Add` modal rendered offscreen at viewports ≤1500 px | CF dashboard quirk | Cowork resizes window to 1600×900 before opening any side-panel modal |

---

## v2 retrofit — what's being added

| Date | Action | What it does |
|---|---|---|
| Today | Drop in fixed `deploy.yml` | Unblocks deploys (closes the silent-fail bug) |
| Today | Drop in `actionlint` step in `ci.yml` | Prevents the bug recurring |
| Today | Drop in `tests/launch-readiness.sh` and gate scripts | Adds gates 0, 5, 5b, 5c, 6, 10 — the existing `apps/web/tests` covers Gate 2 (functional E2E) |
| Today | Drop in `docs/spec/the-tile/{11..15, BUILD_LOG, pat-scopes}.md` | Closes the documentation gap vs v2 |
| Today | Drop in `cowork-plugin/` skeleton | Provides the contract for the plugin; per-skill backends are a Claude Code follow-up |
| Today | This BUILD_LOG.md created | First entry — establishes the audit trail going forward |

---

## v2 follow-up (Claude Code work, not yet done)

These are queued in `CLAUDE-CODE-NEXT-PROMPT.md`. Default-decisions taken during that work will be appended here.

- Build the missing 7 admin sections (Conversations, Marketing, Content, Theme, AI Agent, Analytics, Settings)
- Add draft / published state machine across editable records
- Add `_revisions` table for version history
- Build live-preview iframe with postMessage hot-updates
- Migrate page content from JSX to DB-backed records
- Migrate theme tokens from `tokens.css` to DB + runtime CF binding
- Wire R2 + Cloudflare Images for uploads
- Implement persistence for agent conversations (currently they're not stored)
- Wire Plausible analytics (free tier)
- Build session-based auth + multi-user roles + CSRF tokens
- Server-enforce the no-purchase rule on every paid-action mutation
- Implement every Cowork skill backend so Gate 8 parity tests pass

---

## How to use this log going forward

Every time Cowork or you make a default-decision during build / maintenance:

```markdown
| YYYY-MM-DD | Decision | Rationale (1 line) | Reversible? |
```

Append a row. The buying client reviews this at handoff and decides what to keep / change.

---

## Reversibility legend

- ✅ Yes — change is fully reversible via the admin or Cowork
- ⚠ With caveat — reversible but requires a redeploy or non-trivial step
- ❌ Irreversible — would require external action (e.g. domain transfer fee, account closure)

> ⚠ **Final restatement: any decision that costs money on reversal (transfer fees, plan-tier paid time) is itself a paid action that requires explicit per-action confirmation.**
