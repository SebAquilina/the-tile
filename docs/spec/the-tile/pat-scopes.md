# GitHub PAT scopes — the-tile

Exact scopes the build needs on a fine-grained Personal Access Token. Cowork generates and verifies the token in Phase 0.2 of the Cowork-handoff SOP — you should not need to do this manually, but the canonical list is here as a reference.

## Required scopes (smallest possible set)

**Repository access:** Selected repositories → `SebAquilina/the-tile`

**Repository permissions:**

| Permission | Access | Why this build needs it |
|---|---|---|
| Actions | Read and write | Re-run failed runs, dispatch workflows from Cowork |
| Contents | Read and write | Commit changes via the GitHub API (admin publish flow, content updates, KB regen commits) |
| Issues | Read and write | Post build-status comments on issues, open the launch-readiness issue |
| Metadata | Read-only | Mandatory baseline for any token |
| Pull requests | Read and write | Open PRs from feature branches, comment, mark ready-for-review |
| Workflows | Read and write | Edit workflow files via API (rare but needed for the deploy.yml fix this retrofit landed) |
| Secrets | Read and write | Set / rotate Action secrets via API |

**Account permissions:** none required. Stay scoped to the repository.

## Verification

After token creation, Cowork verifies each scope works with a real API call:

```
GET /user                                                → 200
GET /repos/SebAquilina/the-tile                          → 200
POST /repos/SebAquilina/the-tile/issues (dry-run)        → 201 (then deletes)
GET /repos/SebAquilina/the-tile/actions/workflows        → 200
GET /repos/SebAquilina/the-tile/actions/secrets          → 200
```

If any verification fails, Cowork halts and surfaces the missing scope.

## Rotation

Recommended every 90 days. Cowork's `rotate-pat` skill *(TBD — flesh out as part of v2 admin build)* will:
1. Generate a new token via Chrome MCP at github.com/settings/tokens
2. Verify scopes
3. Update GitHub Actions secrets that reference the old token
4. Revoke the old token

## ⚠ Token storage

- **Never committed to the repo.** Every secret-shaped value goes in `.env.local` (gitignored), GitHub Actions secrets, or Cloudflare Pages env (Secret type).
- **Never displayed in chat history.** Cowork stores in session-only memory.
- **Never logged.** Workflow logs scrub `secrets.*` automatically.
- **Personal — not shared.** If the buying client takes the build, they generate their own PAT with these same scopes (see `14-client-handoff-runbook.md`).
