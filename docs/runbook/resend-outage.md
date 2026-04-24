# Runbook — Resend outage or lead delivery failures

**When**: leads are being submitted but the shop inbox is not receiving email notifications.

## 1. Confirm the scope

- `/api/contact` still returns `{ ok: true, leadId }`? If yes, the form is healthy; the email side is the only issue.
- Check Resend dashboard → Logs for recent attempts. Bounced? Rejected? Never attempted?

## 2. Short-term

- Leads are being persisted regardless (D1 `leads` table, `email_status` column flips to `failed`).
- From the admin UI → Leads, you can see every submission and reply by hand from `info@the-tile.com` until email is restored.

## 3. Fix by symptom

| Symptom | Fix |
|---|---|
| 401 from Resend | Rotate `RESEND_API_KEY` in CF Pages env |
| "domain not verified" | Resend dashboard → Domains → verify DNS records |
| 429 rate limit | Upgrade Resend plan; the free tier is 100/day |
| Sending but not arriving | Check spam; whitelist `leads@notifications.the-tile.com` on the shop inbox |

## 4. Replay pending

Once email is healthy:

```
pnpm wrangler d1 execute the-tile-prod \
  --command="SELECT id,email,created_at FROM leads WHERE email_status='failed' ORDER BY created_at ASC"
```

For each row, re-trigger by hitting the internal retry endpoint (Phase 2: Scheduled Worker picks these up automatically every 15 minutes).

## 5. Post-incident

- Update the `email_status` column to `replied` for the manually-handled leads so the retry worker stops looking at them.
- If this was the first incident, ship the retry worker in the next release.
