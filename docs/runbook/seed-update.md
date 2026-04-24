# Runbook — adding or editing a tile collection

**Audience**: The Tile's showroom team. No coding experience required.

## The short version

1. Go to the GitHub repo at `github.com/SebAquilina/the-tile`.
2. Open `docs/spec/the-tile/seed/products.seed.json`.
3. Click the pencil icon (top-right) to edit in the browser.
4. Add or change a record. Save (green **Commit changes** button).
5. Wait three minutes. The site rebuilds automatically.

## The record template

Copy this as a starting point when adding a new series:

```json
{
  "id": "my-new-series",
  "name": "My New Series",
  "effect": "marble",
  "brand": "Emilceramica",
  "summary": "A one-line description of the series — shows up on the tile card and in search results.",
  "description": "Full long-form description. Markdown is fine.",
  "url": "/collections/marble/my-new-series",
  "sourceUrl": null,
  "attributes": {
    "material": "porcelain stoneware",
    "formats": ["60x120", "120x120"],
    "finishes": ["natural", "lappato"]
  },
  "images": [],
  "tags": ["marble", "luxury"],
  "bestFor": ["statement interiors", "feature walls"],
  "inStock": true,
  "showInCatalog": true
}
```

### Rules

- **`id` must be unique** across all products. Lowercase, hyphens or underscores, no spaces.
- **`effect` must be one of**: `marble`, `wood`, `stone`, `slate`, `concrete`, `terrazzo`, `terracotta`, `gesso`, `full-colour`.
- **`url` must match the pattern** `/collections/<effect>/<id>`.
- **`summary`**: keep it under 200 characters. This is what search engines and tile cards show.

## Marking a tile out of stock

Find the record, change `"inStock": true` to `"inStock": false`, commit. Restock the same way.

## Hiding a tile without deleting it

`"showInCatalog": false` removes the tile from the listing but keeps the URL alive (for bookmarks and links from old projects).

## What happens after the commit

GitHub runs two automatic jobs:

1. **CI** — validates the JSON and rebuilds the site.
2. **Sync KB** — regenerates the agent's knowledge. The concierge will know about your new tile within about five minutes.

If something is wrong with your edit (e.g. a typo in the JSON), CI will fail and you will get an email. The old version of the site stays live until you fix it.

## Still easier: ask us to do it

If the above feels fiddly, email a note to the dev team and we will handle it same-day.
