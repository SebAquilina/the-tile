---
name: view-leads
description: Show recent leads (contact-form + agent-captured). Trigger when operator says "show me this week's leads", "any new contact submissions", "what did people ask the agent today". Read-only — does not modify state.
---

# view-leads

Display recent leads.

## Inputs
- Time window (today / this week / this month / custom). Default: this week.
- Optional filter: source (contact-form / agent / all).

## What it does
1. GET `/api/admin/leads?window=...&source=...`.
2. Returns a summary table to chat: name, email, source, message preview, status.
3. Offers next-step actions: "open in admin", "mark contacted", "export CSV".

## ⚠ No paid action
Read-only.
