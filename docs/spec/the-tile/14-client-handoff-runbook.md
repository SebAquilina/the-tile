# Client-handoff runbook — the-tile

Step-by-step procedure to transfer **all** control of the-tile from the operator's accounts to a buying client's. Both parties present, real-time.

> ⚠ **Every paid step in this runbook is on the client's card. Operator never enters payment details. Domain transfer fees, paid plan upgrades, paid SaaS sign-ups — client confirms and pays each one.**

---

## Pre-handoff checklist (operator does this first)

- [ ] Test suite green on production (`./tests/launch-readiness.sh` returns ALL GATES GREEN)
- [ ] All defaults logged in `BUILD_LOG.md` and reviewed by the client
- [ ] `13-website-guide.md` complete and walked-through with the client
- [ ] Cowork plugin skeleton in `cowork-plugin/` validates (`plugin.json` parses)
- [ ] Client has accounts ready: GitHub, Cloudflare, registrar (or list of "things to sign up for" if not)
- [ ] Client knows their admin credentials (delivered via password manager, not in chat / email body)
- [ ] All operator-paid SaaS keys identified for re-issue under client's billing — listed below

---

## What to transfer (the inventory)

| Asset | Currently under | Will be under |
|---|---|---|
| GitHub repo `SebAquilina/the-tile` | operator (Seb) | client's account or org |
| Cloudflare Pages project `the-tile-web` | operator's CF account (`cfd32b6623c3b1adce7345cdff737d14`) | client's CF account |
| Cloudflare D1 databases (prod + staging) | operator's CF account | client's CF account |
| Custom domain `the-tile.com` | operator's registrar | client's registrar (or stay + DNS pointer) |
| `GEMINI_API_KEY` | operator's Google Cloud | client's Google Cloud |
| `RESEND_API_KEY` | operator's Resend | client's Resend |
| `SENTRY_AUTH_TOKEN` | operator's Sentry | client's Sentry |
| `CLOUDFLARE_API_TOKEN` | operator's CF | client's CF |
| `IP_HASH_SALT` | operator-set | client-rotated |
| `ADMIN_USER` / `ADMIN_PASSWORD` | operator-set | client-rotated |
| GitHub Actions secrets (above set) | operator's repo | client's repo (after transfer) |
| Sentry organisation/project | operator's | client's |
| Cowork plugin install | operator's machine | client's machine |
| Recurring cost ownership | operator pays | client pays from `<handoff-date>` |

---

## Step-by-step transfer

### 1. GitHub repository

Two options — pick with the client:

**Option A — Full transfer (operator drops out completely):**
- Operator: github.com/SebAquilina/the-tile → Settings → "Transfer ownership" → enter client's GitHub username/org → confirm
- Client: accept the transfer invitation within 24h
- Operator's access drops to "no access" after acceptance
- Verification: `gh repo view <client-owner>/the-tile` shows the new owner

**Option B — Add client as Admin, operator stays as Collaborator:**
- Operator: Settings → Collaborators → invite client as Admin
- Client: accept
- Operator can stay on for ongoing dev work, or remove themselves later

⚠ **Branch protections, GitHub Actions secrets, webhooks, and Issues all travel with the repo on transfer.** Verify after transfer.

### 2. Cloudflare Pages project

Cloudflare does not support project transfer between accounts. The procedure:

1. Client signs in to their Cloudflare account.
2. Client creates a new Pages project named `the-tile-web` connected to the (now-transferred) GitHub repo.
3. **Copy env vars from operator's CF to client's** — operator opens their CF Pages project, exports the env-var list (names + values for non-secrets, names only for secrets); client adds them to their CF project. **Operator never screen-shares secret values; instead, secrets are re-issued at step 4.**
4. Client also adds the D1 binding to the new Pages project (the Pages project needs to be linked to a D1 database; client creates a new D1 instance and runs the migrations).

⚠ **The custom domain stays on the operator's account during this transition.** Don't flip it until client's CF Pages build is verified working at the per-deploy URL.

### 3. Cloudflare D1 databases

D1 databases must be re-created on the client's account.

1. Client creates two D1 databases: `the-tile-prod` and `the-tile-staging`.
2. Client updates `wrangler.toml` (or similar config) with the new D1 UUIDs.
3. Client runs `pnpm db:migrate:prod` and `pnpm db:migrate:staging` against the new instances.
4. **Data export from operator's D1, import into client's** — operator runs `wrangler d1 export the-tile-prod --output=prod-data.sql` and shares the file via secure channel; client runs `wrangler d1 execute the-tile-prod --file=prod-data.sql`.
5. Verification: `wrangler d1 execute the-tile-prod --command="SELECT count(*) FROM products"` matches operator's count.

### 4. Domain transfer or DNS migration

**Option A — Transfer the domain to client's registrar:**
1. Operator unlocks domain at the current registrar.
2. Operator generates EPP/auth code.
3. Client initiates transfer at their registrar of choice (Cloudflare Registrar recommended for cost).
4. ⚠ **Cost: ~$10–15 transfer fee, paid by client on their card. Operator does not pay.**
5. Time: 5–7 days for ICANN-mandated transfer window.
6. Once propagated, client adds the domain to their CF Pages project as a custom domain.
7. Client updates DNS records (A / CNAME for apex and www).
8. Verification: `dig +short the-tile.com` returns client's CF IPs; `curl -I https://the-tile.com/` returns 200 with SSL.

**Option B — Keep domain at operator's registrar, point DNS at client's CF:**
1. Operator updates DNS at current registrar — A or CNAME → client's CF Pages project.
2. Client adds the custom domain to their CF Pages project (in pending-DNS-verification state).
3. Once DNS propagates, CF auto-issues SSL cert for client's project.
4. Verification: same as Option A.
5. Caveat: operator still owns the domain and pays for renewals. Pick A for clean handoff.

### 5. Third-party API keys

For each integration, keys move from operator's account to client's. Sequence:

**Gemini API key:**
- Client signs in at https://aistudio.google.com/apikey (uses client's Google account)
- Client generates a new key
- Client adds `GEMINI_API_KEY` to their CF Pages env (Secret type)
- Operator revokes old key

**Resend API key:**
- Client signs up at https://resend.com (or signs in if existing account)
- Client adds and verifies the domain `the-tile.com` for sending
- Client generates a new API key
- Client adds `RESEND_API_KEY` to their CF Pages env (Secret type)
- Operator revokes old key
- ⚠ **If sending volume exceeds Resend's free tier (100/day, 3000/mo), Resend Pro at $20/mo is a paid action — client confirms and pays.**

**Sentry token:**
- Client signs up at https://sentry.io (or signs in)
- Client creates a new project for `the-tile`
- Client generates an auth token with `project:read`, `project:write`, `project:releases` scopes
- Client adds `SENTRY_AUTH_TOKEN` to GitHub Actions secrets
- Operator revokes old token

**Cloudflare API token:**
- Client signs in to their CF account
- Client generates a new API token with `Pages: Edit`, `Workers Scripts: Edit`, `D1: Edit`, `DNS: Edit (zone-scoped to the-tile.com)` permissions
- Client adds `CLOUDFLARE_API_TOKEN` and their `CLOUDFLARE_ACCOUNT_ID` to GitHub Actions secrets
- Operator revokes old token

**IP_HASH_SALT and ADMIN_USER / ADMIN_PASSWORD:**
- Client picks new values (the v1 used `user`/`password` — clearly placeholder).
- Client adds the new values to their CF Pages env (`ADMIN_USER` Plaintext, `ADMIN_PASSWORD` Secret, `IP_HASH_SALT` Secret).
- Client triggers a redeploy (admin creds are BUILD_TIME-inlined; rotation requires rebuild — see Section 7 of `13-website-guide.md`).

After all keys re-issued: **redeploy** to ensure the new build picks them up. Verification: Gate 5c (admin-auth) green with the new credentials.

### 6. Cowork plugin install on the client side

1. Client installs Cowork on their own machine (Cowork is included in Pro $20/mo or Max $100-200/mo plans — **client confirms the plan they want before installing**).
2. Client opens Cowork and runs `/install-plugin` pointing at the `cowork-plugin/` directory in the (now-transferred) repo.
3. Plugin's skills, slash commands, and connectors become available.
4. Client connects their own data sources (Google Drive, Notion, Slack — only as needed). **Operator does not connect these on client's behalf.**

### 7. Recurring cost ownership flip

| Cost | Was paid by | Is now paid by | Action to flip |
|---|---|---|---|
| Domain renewal | Operator | Client | Step 4 above (transfer or registrar handoff) |
| Cloudflare paid plan | Free tier — neither | n/a unless upgraded later | n/a |
| D1 paid tier | Free tier — neither | n/a unless usage exceeds | n/a |
| Resend (if paid) | Operator | Client | Step 5 above (sign-up) |
| Sentry (if paid) | Operator | Client | Step 5 above (sign-up) |
| Gemini API | Operator | Client | Step 5 above (key re-issue) |
| Cowork subscription | Operator | Client | Step 6 above |

**Sign-off:** client acknowledges in writing they own all recurring costs from `<handoff-date>` onwards. Add a comment to a GitHub Issue with this acknowledgment for the audit trail.

### 8. Operator access removal (the final step)

Once everything is verified green on the client side:

- [ ] Operator removes themselves as collaborator on GitHub repo (if Option B in step 1)
- [ ] Operator deletes their CF Pages project `the-tile-web` (only after client's is live and verified at the production domain)
- [ ] Operator revokes any tokens / API keys generated under operator's accounts
- [ ] Operator removes registrar access (if Option A in step 4)
- [ ] Operator deletes the local copy of admin credentials
- [ ] Operator's local `.env.local` files are deleted or rotated to new client-issued values
- [ ] Final sign-off email to client confirming "you have full ownership" + a link to `13-website-guide.md` and instructions for what to do if anything breaks

The handoff is done.

---

## Post-handoff support (optional)

If the operator stays on retainer, scope to be agreed directly:
- What's included (e.g. "monthly Cowork-driven content updates, on-call for breakages")
- What's not (e.g. "redesign, new features, third-party integrations beyond what shipped")
- How the client requests work (e.g. "open an issue with the `request` label on the repo")
- Response SLA
- Billing arrangement — ⚠ **operator and client agree commercials directly; this skill does not handle invoicing**

> ⚠ **Final restatement, because it bears repeating: every paid action in this handoff — domain transfer fees, plan upgrades, sign-up costs — is on the client's card, paid by the client. Operator never enters their card details. Client confirms each one.**
