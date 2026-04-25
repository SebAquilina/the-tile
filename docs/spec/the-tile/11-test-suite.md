# Test suite — the-tile

Build-specific application of `references/11-test-suite.md` (the v2 skill's universal test suite). Every gate runs against the-tile's actual deployment.

> ⚠ **No test in this suite spends money. No test creates a paid resource. No test hits a production payment endpoint with a real card. the-tile does not currently take payments — Stripe is not present.**

---

## Tooling

Already installed in the-tile:
- Playwright (`apps/web/tests/e2e`)
- Vitest (`apps/web/tests/`)
- Lighthouse CI (`apps/web/lighthouserc.json`)

To install for the v2 retrofit gates:

```bash
brew install actionlint || curl -sSL https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash | bash
brew install gitleaks
```

---

## The gate scripts (in the retrofit's `tests/` directory)

| Gate | Script | Coverage today |
|---|---|---|
| Gate 0 — URL reachability | `tests/gate-0-reachability.sh` | All public pages + admin gate + pages.dev mirror |
| Gate 1 — Build sanity | (inlined into `launch-readiness.sh`) — runs lint, typecheck, test, build, actionlint, gitleaks |
| Gate 2 — Functional E2E | `apps/web/tests/e2e` (already shipped) — home, collections, contact, agent, save-list |
| Gate 3 — Agent quality | TODO — needs `tests/agent-dialogs/run.ts` per spec section. Skipped today. |
| Gate 4 — Lighthouse + a11y | `apps/web/lighthouserc.json` (Lighthouse) + axe (TBD wire) |
| Gate 5 — Headers | `tests/gate-5-headers.sh` |
| Gate 5b — Bundle secret scan | `tests/gate-5-bundle-secret-scan.sh` |
| Gate 5c — Admin auth (live) | `tests/gate-5-admin-auth.sh` |
| Gate 6 — Env-var modes | `tests/gate-6-envvar-mode.sh` |
| Gate 7 — Admin functional E2E | TODO — needs full admin per `15-admin-panel-spec.md` |
| Gate 8 — Admin/Cowork parity | TODO — needs both surfaces; Cowork plugin skill backends pending |
| Gate 9 — Admin → live integration | TODO — same dependency |
| Gate 10 — Admin security | `tests/gate-10-admin-security.sh` (baseline) — full version needs the v2 admin |

The aggregator: `tests/launch-readiness.sh` runs every available gate, summary at the end. Any red gate is a launch blocker.

---

## Per-gate details specific to the-tile

### Gate 0 — URL reachability

The `gate-0-reachability.sh` script checks every public route plus admin gate behaviour. To run with admin auth verification:

```bash
export ADMIN_USER="..."
export ADMIN_PASSWORD="..."
./tests/gate-0-reachability.sh
```

**Known gotcha:** if `www.the-tile.com/admin` returns 404 instead of 401, the custom domain is not wired correctly to the production deployment. Fix in CF dashboard before continuing.

### Gate 5c — Admin auth on live deployment

Tests that the live admin gate accepts current credentials. Specifically catches the **BUILD_TIME inlining bug from v1**:

- Cred rotated in CF dashboard but middleware bundled the old value at build → admin still rejects new cred
- Fix: run `gh workflow run deploy.yml` (or push an empty commit) to rebuild

If Gate 5c fails after a credential rotation, the fix is always: trigger a redeploy.

### Gate 6 — Env-var modes

Scans `apps/web/.env.example` for every declared env var, then greps `apps/web/{app, components, lib, middleware.ts}` for `process.env.X` references. Each reference is classified:
- In `middleware.ts` or imported by it → BUILD_TIME
- In a route file with `runtime = 'edge'` → BUILD_TIME
- Otherwise → RUNTIME
- `NEXT_PUBLIC_*` → BUILD_TIME (client inline)

Each var's classification is cross-checked against `09-deploy-plan.md`'s secrets table. Drift = WARN. The deploy plan should be updated to match.

### Gate 7–10 (deferred)

These require the v2 admin panel buildout per `15-admin-panel-spec.md`. Estimated 6–8 sessions of Claude Code work. The scripts in `tests/` will be expanded as the work lands.

---

## CI integration

`ci.yml` (in this retrofit) adds an `actionlint` job that runs on every PR. The bug from v1 (`secrets.X` in step `if:`) cannot recur.

Future: when Gates 7–10 mature, add them to `ci.yml` as a separate workflow that runs against the staging URL (not production — never run security gates against prod with real users in flight).

---

## ⚠ The no-purchase rule in tests

Restated:

- No Stripe live calls — Stripe is not present in the-tile.
- Resend tests use mocked sender; we do not send real emails to test users.
- Domain transfer / renewal — out of scope for tests.
- Sentry, Plausible, Cloudflare paid plan toggles — not exercised by tests.
- Bot-protection (Turnstile) — needs the widget creation step (still pending per Issue #2); tests skip when key is empty.
