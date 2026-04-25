---
name: edit-page
description: Edit any public page's content (home, about, contact, showroom, journal, privacy, terms, cookies). Trigger when the operator says "change the about-page hero", "update the contact info", "rewrite the privacy policy", "swap the home page subhead". Once the v2 admin Content section ships, this hits the DB; until then it edits the JSX file and opens a PR.
---

# edit-page

Edit content on any public page.

## Inputs

- Page identifier — slug (e.g. `home`, `about`, `contact`) or URL.
- Free-text edit instruction.

## What it does

**Today (pre-v2-admin):**
1. Maps page slug to source file under `apps/web/app/(public)/<slug>/page.tsx`.
2. Surfaces the current content of the relevant section.
3. Edits the JSX inline using best-match.
4. Opens a PR; operator approves; merge → deploy.

**Post-v2-admin (per `15-admin-panel-spec.md`):**
1. Calls `PATCH /api/admin/content/pages/<slug>` with the parsed change.
2. Backend writes to draft.
3. Live preview iframe shows the change.
4. Operator runs `deploy-now` to publish.

## Defaults

- Edits go to draft.
- Markdown / rich text supported in the v2 path.

## ⚠ No paid action

Free. No external costs.

## Errors

- Page not found → list 5 closest matches.
- Section ambiguous ("the hero" but page has 2 hero blocks) → surface options.
