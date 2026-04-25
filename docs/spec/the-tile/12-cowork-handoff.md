# Cowork → Claude Code handoff for the-tile

Build-specific application of `references/10-cowork-claude-code-handoff-sop.md`. This file is what Cowork reads to drive the v2 retrofit work on the-tile.

> ⚠ **No paid action — domain renewal, paid plans, Stripe, broadcast emails over free quota — runs without explicit per-action user confirmation. Default-deny. Pre-authorisations don't carry over.**

---

## Phase 0 — Pre-flight (Cowork before opening Claude Code)

### 0.1 Verify accounts

Cowork verifies the operator (Seb) is signed into:
- https://github.com/SebAquilina (GitHub)
- https://dash.cloudflare.com/cfd32b6623c3b1adce7345cdff737d14 (Cloudflare)
- the operator's domain registrar (the-tile.com)

If not signed in, Cowork links and waits.

### 0.2 Verify or generate API tokens

Cowork uses Chrome MCP to drive each provider's token-generation page:

| Token | Page | Scopes |
|---|---|---|
| GitHub fine-grained PAT | github.com/settings/personal-access-tokens/new | per `pat-scopes.md` |
| Cloudflare API token | dash.cloudflare.com/profile/api-tokens | Pages: Edit, Workers: Edit, D1: Edit, DNS: Edit (zone the-tile.com) |
| Gemini API key | aistudio.google.com/apikey | (default — single key) |
| Resend API key | resend.com/api-keys | Sending Access |
| Sentry auth token | sentry.io/settings/account/api/auth-tokens/ | project:read, project:write, project:releases |

Cowork stores all token values in session-only memory. Verifies each with a real API call before proceeding.

### 0.3 Itemise paid-action plan

For the-tile retrofit, the paid-action plan is **empty** by default — everything stays on free tiers. The few items that *could* surface as paid during the v2 admin build:

| Action | Cost | Trigger |
|---|---|---|
| Resend Pro | $20/mo | Only if broadcast volume exceeds 100/day |
| Sentry paid | $26/mo+ | Only if errors exceed 5k/mo |
| Plausible | $9/mo+ | Only if you opt into paid analytics |
| CF Workers paid | $5/mo | Only if traffic exceeds 100k req/day |
| Domain renewal | varies | When the domain expires |

Each is a per-action confirm at the moment the trigger fires. None is pre-authorised.

---

## Phase A — Land the v2 retrofit (this is where you are)

Steps from `README.md` of the retrofit:
1. Drop in `deploy.yml` + `ci.yml`
2. Run Gate 0 reachability
3. Drop in `tests/`
4. Drop in `docs/spec/the-tile/{11-15, BUILD_LOG, pat-scopes}`
5. Drop in `cowork-plugin/` skeleton
6. Hand the prompt to Claude Code

Cowork verifies each step's gate before moving on:
- Step 1 → `gh run list --workflow=deploy.yml --limit=1` shows success
- Step 2 → all green
- Step 3 → scripts execute, no syntax errors
- Step 4 → files committed, links resolve in markdown
- Step 5 → `cowork-plugin/plugin.json` parses

---

## Phase B — Drive Claude Code through Phases 1–7

(Per `CLAUDE-CODE-NEXT-PROMPT.md`.)

After each Claude Code phase reports `PHASE_DONE`:

1. Cowork runs the relevant test gate.
2. If green: paste back `Gate green. Continue to <next-phase>.`
3. If red: paste error + `Gate red. Fix: <summary>. Re-run when ready.`

For decisions Claude Code surfaces:
1. Cowork searches the spec for the answer.
2. If the spec answers it, paste with file:line.
3. If the spec lists a default, paste it + log to BUILD_LOG.md.
4. If the spec is silent, pick what matches Charter + reference site, paste + log.
5. If it's a paid action, destructive op, or OWNER_DECIDES → escalate to Seb.

---

## Phase C — Run the launch-readiness suite

When Claude Code reports `PHASE_DONE: gate-completion`:

```bash
./tests/launch-readiness.sh
```

If any gate red: feed back to Claude Code with the error log; max 3 retries on same gate before escalating to Seb.

If all green: post a launch-readiness comment on a GitHub issue and surface to Seb: *"All 11 gates green. Approve final deploy?"*

---

## Phase D — Generate website guide & client handoff

Cowork populates / refreshes:
- `13-website-guide.md` — verify it matches shipped reality
- `14-client-handoff-runbook.md` — verify the inventory is accurate

Both committed.

---

## Phase E — Final approval

Surface to Seb:
*"All 11 gates green. Test report: <link>. Site live at https://www.the-tile.com. Ready for client handoff via 14-client-handoff-runbook.md when you say so."*

---

## Phase F — Client handoff (when Seb is ready to transfer)

Walk through `14-client-handoff-runbook.md` with Seb and the client both present. Per-step. Domain transfer fees, paid plan upgrades during transfer — all on the client's card. Operator never enters payment details.

---

## ⚠ Cowork's hard rules for the-tile retrofit

- No purchase, plan upgrade, paid sign-up, or money movement on Seb's behalf without explicit per-action confirmation.
- No destructive git op without confirmation.
- No editing production directly — every change goes through a PR.
- No bypassing gate failures — 3 retries, then escalate.
- No spending Seb's money to "make progress" while he's away. Wait.
