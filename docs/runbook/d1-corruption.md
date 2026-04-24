# Runbook — D1 corruption or bad migration

**When**: queries return stale or partial data, a migration was partially applied, or `sync-seed` errored mid-run.

## 1. Stop the bleeding

- Disable the nightly sync-kb workflow until resolved.
- Put a maintenance banner on the site if the catalog is visibly wrong:
  `echo MAINTENANCE=1` in CF Pages env and trigger a rebuild.

## 2. Snapshot before touching anything

```
pnpm wrangler d1 export the-tile-prod --output=backups/$(date +%F)-prod.sql
```

Commit the file to the `backups/` folder on a branch (not `main`). Run the same for staging.

## 3. Diagnose

- `pnpm wrangler d1 execute the-tile-prod --command="SELECT COUNT(*) FROM products"` — compare to `seed/products.seed.json` count.
- `pnpm wrangler d1 execute the-tile-prod --command="SELECT id FROM products ORDER BY id"` — diff against the seed id list.

## 4. Recover

- **Missing rows only**: re-run `pnpm sync-seed main` (it truncates + reinserts).
- **Corrupt schema**: drop + recreate the affected table using the SQL in `drizzle/0000_init.sql`, then re-run sync-seed.
- **Unknown state**: drop all four tables, re-apply the latest migration, re-run sync-seed.

## 5. Verify

- `curl https://the-tile.com/collections | grep -c "data-product-id"` — should match the seed count.
- `curl https://the-tile.com/api/health` — 200 OK.
- Open `/collections/marble` in a browser, confirm the 10 tiles render.

## 6. Follow up

- Document what caused the corruption in the issue.
- Add a CI check if the root cause was avoidable (e.g. a migration guard).
