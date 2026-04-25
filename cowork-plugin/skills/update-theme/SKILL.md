---
name: update-theme
description: Edit theme tokens — colors, fonts, font sizes, logo, motion, layout density, border radius. Trigger when operator says "make the primary color warmer", "swap the heading font", "make headings bigger", "use this logo file", "increase whitespace". Once v2 admin Theme section lands, this writes to the runtime CF binding (no rebuild needed for color/font changes); pre-v2 it edits tokens.css and opens a PR.
---

# update-theme

Edit theme tokens.

## Inputs
- Free-text instruction with the desired change.
- Optional: a logo / image file path in the workspace.

## What it does (post-v2-admin)
1. PATCH `/api/admin/theme` with the change.
2. Live-preview iframe updates instantly.
3. Operator runs `deploy-now` to publish.

## ⚠ No paid action
Free. CF Images on free tier covers small sites; only triggers paid-action confirm if usage exceeds.

## Defaults
- Color picker accessibility checker auto-warns on contrast fail; skill defaults to picking AA-passing pairs.
- Font swap regenerates the Google Fonts `<link>` automatically.
