# Runbook — secrets rotation

All secrets live in two places: GitHub Actions Secrets (for CI/CD) and Cloudflare Pages Environment Variables (for runtime). Never commit a secret to the repo. Never paste a secret into a PR description.

## Rotation schedule

| Secret | Every | On incident |
|---|---|---|
| `GEMINI_API_KEY` | 90 days | Always |
| `RESEND_API_KEY` | 90 days | Always |
| `TURNSTILE_SECRET` | 180 days | Always |
| `CLOUDFLARE_API_TOKEN` | 180 days | Always |
| `SENTRY_AUTH_TOKEN` | 180 days | Always |
| `IP_HASH_SALT` | Never — unless incident | Always |
| `ADMIN_PASSWORD` | 180 days (or personnel change) | Always |

## Step-by-step per secret

### GEMINI_API_KEY
1. Google AI Studio → Create Key → name it `the-tile-prod-YYYYMM`.
2. Cloudflare Pages → `the-tile-web` → Settings → Environment variables → Production → set `GEMINI_API_KEY` to the new value.
3. Repeat for Preview env.
4. Trigger a redeploy (any empty commit works).
5. After a full minute of green traffic, delete the old key in AI Studio.

### RESEND_API_KEY
1. Resend dashboard → API Keys → Create new.
2. Update CF Pages env (prod + preview).
3. Redeploy.
4. Send a test lead; verify arrival.
5. Delete the old key.

### TURNSTILE_SECRET + NEXT_PUBLIC_TURNSTILE_SITE_KEY
1. CF Turnstile → Widget → Rotate keys (you get a new pair).
2. Update both keys in CF Pages env.
3. Redeploy.
4. Submit a test enquiry through the form.

### CLOUDFLARE_API_TOKEN
1. CF dashboard → My Profile → API Tokens → Create. Scope: Pages Edit, D1 Edit, Workers Edit on the-tile account only. 1-year expiry.
2. GitHub → Repo Settings → Secrets → Actions → update `CLOUDFLARE_API_TOKEN`.
3. Re-run the last successful deploy workflow to verify.
4. Delete the old token in CF.

### SENTRY_AUTH_TOKEN
1. Sentry → Settings → Auth Tokens → Create. Scope: `project:releases`, `project:write` on the `web` project only.
2. Update GitHub Actions secret.
3. Delete the old token.

### IP_HASH_SALT
- Generate: `openssl rand -hex 32`.
- Set in CF Pages env.
- Redeploy. All in-memory rate-limit counters reset — accept the brief inflation window.

### ADMIN_PASSWORD
- Generate a strong password in 1Password.
- Update `ADMIN_PASSWORD` in CF Pages env (production + preview).
- Communicate to the team out-of-band.
- Redeploy.
