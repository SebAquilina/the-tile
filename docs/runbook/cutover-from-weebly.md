# Runbook — one-time cutover from Weebly

**When**: the day we move `the-tile.com` from Weebly to this Cloudflare Pages site.

## T-14 days

- Confirm all supplier imagery licences. If blocked, decide whether to launch without images or delay.
- Draft the customer-facing cutover notice (email + Facebook post) — "we are refreshing the website, brief hiccups possible on <date>".
- Confirm DNS registrar credentials; if the registrar is the same as where Weebly was configured, make sure we have admin access separately from the Weebly account.

## T-7 days

- Staging at `staging.the-tile.com` signed off by the client (owner + at least one team member).
- CI/CD green for a full week of pushes.
- Sentry + Plausible active on staging.

## T-1 day

- Lower `the-tile.com` A/AAAA records' TTL to 300 seconds at 09:00. Wait for propagation (max 24h for legacy TTLs).
- Final QA on staging against `10-qa-checklist.md`.
- Take a Weebly site export as a cold backup.

## Cutover day

1. **Morning (low-traffic window for Malta: 06:00–08:00 local)**:
   - Update `the-tile.com` A/AAAA to Cloudflare Pages (orange-cloud proxied).
   - Update `www.the-tile.com` CNAME to `the-tile.com`.
2. **Within 15 min of DNS flip**:
   - `curl -I https://the-tile.com/` — expect CF headers.
   - Verify `/sitemap.xml` returns the new XML.
   - Verify two or three of the most-trafficked old URLs 301 to the new routes (pick from `apps/web/public/_redirects`).
   - Submit the new sitemap to Google Search Console.
3. **Within 1 hour**:
   - Test the contact form end-to-end. A real lead lands in the shop inbox.
   - Test the agent end-to-end on home + via `/api/agent/chat`.
   - Ask one team member on mobile to browse 5 tiles.
4. **End of day**:
   - Raise DNS TTL back to 3600 seconds.
   - Keep Weebly running in read-only mode for 30 days.

## T+30 days

- Remove the Weebly publish.
- Archive the old account credentials in 1Password.
- Retrospective: what went well, what didn't, what to change before the next site migration.

## Rollback (any time T-0 through T+48h)

- Flip the A/AAAA back to the Weebly IP.
- TTL is low enough that propagation is fast.
- Announce the rollback on Facebook; re-plan.
