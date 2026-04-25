---
name: update-product
description: Edit a product (tile)'s price, copy, images, variants, or visibility. Trigger when the operator says things like "set the price of <product> to <amount>", "rename <product>", "change the description of <product>", "make <product> draft / published", "swap the lead image on <product>". Identifies target by id or by best title-match.
---

# update-product

Update an existing product on the-tile. Used for everything from price edits to copy tweaks to image swaps.

## Inputs

- `productId` (preferred) — the product's UUID. Cowork tries title-match if not given.
- Free-text instruction — Cowork extracts the field(s) and value(s).

## What it does

1. Resolves the product. If the title-match is ambiguous, surfaces the candidates and asks which.
2. Calls `PATCH /api/admin/products/<id>` with the parsed patch object. Backend writes to the draft state.
3. Returns the diff to Cowork: which fields changed from what to what.
4. Reports to the operator: *"I've staged this change in draft. Run 'deploy-now' to publish, or 'preview' to see it on staging."*

## Defaults

- Edits go to **draft** state. Nothing on production changes until the operator runs `deploy-now`.
- Image uploads go to R2 with auto-optimization (Cloudflare Images).
- Slug is auto-regenerated from title if the title changes — old slug becomes a 301 redirect.

## ⚠ No paid action

This skill never costs money. If the operator asks to "switch to live Stripe" or "upgrade Resend tier" — that's a different skill (settings change), not this one.

## Errors

- Product not found → list 5 closest title matches.
- Field not editable → list which fields are editable on the product schema.
- Validation fails → surface the validation error in plain language.

## Example

> "Set the price of the matte black hex tile to €45"

→ Cowork resolves "matte black hex tile" → product UUID, calls PATCH with `{ price: 45.00 }`, returns the diff, reports staged-in-draft.
