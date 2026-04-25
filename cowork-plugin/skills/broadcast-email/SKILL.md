---
name: broadcast-email
description: Send a campaign to leads / customers via Resend. Trigger when operator says "send a broadcast about the new collection", "email the leads list about our reopening". ⚠ Above 100/day this is a PAID ACTION — Resend Pro at $20/mo. Default-deny on the upgrade; per-action confirm on the spend.
---

# broadcast-email

Send a campaign email.

## Inputs
- Subject line.
- Body (markdown supported).
- Recipient segment (e.g. "all leads from agent in last 30 days").
- Optional: schedule for a future time.

## What it does
1. Resolves recipients from the segment query.
2. Estimates send count + time-of-day distribution.
3. ⚠ **Checks against Resend's free tier (100/day).** If estimate exceeds:
   - Surfaces: "this batch will exceed Resend's free tier — sending requires Resend Pro at $20/mo. Confirm?"
   - **Default-deny.** Operator must type "yes, upgrade Resend" explicitly.
4. Queues sends via Resend with rate limiting.
5. Reports sent count + bounce summary.

## ⚠ Per-action paid confirm
Above 100 emails/day. Below the threshold, no confirm needed.
