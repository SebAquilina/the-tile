# Runbook — deploy failure

**When**: the `Deploy` GitHub Action fails on a push to `main` or `staging`.

## 1. Triage (first 10 minutes)

- Open the failing run in GitHub Actions.
- Note which step failed: `Build`, `Apply D1 migrations`, `Sync seed`, `Deploy to Cloudflare Pages`, or `Upload Sentry release`.
- If the failure was in a later step, the build still succeeded — the site is currently still live on the previous deploy.

## 2. By failure point

### Build step
- Run `pnpm build` locally on the same commit. Reproduces? Fix and push a follow-up commit.
- If CI-only: check `NODE_VERSION` mismatches, missing env vars in the Actions secrets, or a pnpm lockfile drift.

### Apply D1 migrations
- `wrangler d1 migrations list <db>` — does the target DB already have the migration?
- If migration is half-applied: export the current D1 state (`wrangler d1 export`), inspect, write a fix-forward migration. **Never** delete rows; hand-craft the recovery statement.
- If DB is out of disk or rate-limited: check Cloudflare dashboard for throttling.

### Sync seed
- The script calls the D1 HTTP API. Check `CLOUDFLARE_API_TOKEN` permissions — it needs D1 edit scope.
- Re-run locally: `pnpm sync-seed staging`.

### Deploy to Cloudflare Pages
- Check CF dashboard → Pages → the-tile-web → Deployments.
- If the latest deploy is in "Failed" state, click to see the edge build log.
- `wrangler_action@v1` occasionally times out — re-run the workflow first before digging deeper.

### Upload Sentry release
- Non-blocking; the site is already live. Investigate auth token expiry on Sentry, then re-run.

## 3. Roll back

If the new deploy is already live and producing errors:

- CF dashboard → Pages → the-tile-web → Deployments → pick the last green deploy → **Rollback to this version**.
- In Git, revert the offending commit: `git revert <sha> && git push origin main`. Wait for the revert deploy to go green.
- Post a short incident note in the team channel.

## 4. Post-mortem

- Create a GitHub issue tagged `incident` with the Actions run URL, the failure step, the fix, and the duration.
- If the failure recurred, add a guard: schema test, smoke test, or a pre-flight check in CI.
