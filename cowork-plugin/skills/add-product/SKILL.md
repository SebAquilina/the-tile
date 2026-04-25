---
name: add-product
description: Create one or more new products (tiles). Trigger when the operator says "add this product", "import these products from CSV/Excel", "create new tile", "stock these new items". Accepts single-product description, structured rows (CSV / xlsx), or a vendor catalog URL.
---

# add-product

Create new products. Single-shot or bulk.

## Inputs

- Free-text product description, OR
- Path to CSV / xlsx file in the workspace, OR
- URL of a vendor catalog page Cowork should scrape (with consent — never run on copyrighted catalogs without permission).

## What it does

1. Parses the input into structured products following `apps/web/db/schema.ts` shape.
2. For each new product, calls `POST /api/admin/products` (writes to draft).
3. Triggers `regenerate-kb` automatically so the agent learns about the new items.
4. Reports the count + a summary to the operator.

## Defaults

- All new products start in `draft` state.
- Slug auto-generated from title with collision check.
- Default brand = the vendor field if present, else "uncategorised."
- Default images = vendor-supplied if scraping a catalog with permission; otherwise empty placeholder until operator uploads via `update-product`.

## ⚠ No paid action

Free. No external API costs beyond Cowork's own token spend.

## Errors

- Required field missing (title, brand, effect) → ask for it.
- Duplicate slug → suggest 3 alternatives or append `-2`.
- CSV malformed → return row-by-row diagnostic.

## Example

> "Add 5 new terrazzo tiles from this CSV: catalog-2026-q2.csv"

→ Cowork parses the CSV, creates 5 draft products, triggers KB regen, reports: *"Added 5 products in draft state. Run 'deploy-now' to publish."*
