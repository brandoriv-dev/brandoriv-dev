# Publish the audit documentation baseline

- Status: applied
- Verified: partly
- When (UTC): 2026-10-04T01:38:32Z
- Actor: Codex for Brandon Rivera
- Checked: four merged-main CI jobs and full local build passed; Wrangler published the version below, home returned HTTP 200, retired MCP returned HTTP 410, anonymous Harness/Ledger returned HTTP 401.
- Not checked: real owner browser sign-in and authenticated Harness/Ledger flows; runtime source changes were documentation only.
- Authorization: Brandon requested merge and deploy of all six audit/documentation PRs.
- Target: Cloudflare Worker `brandoriv-dev`, public `https://brandoriv.dev`.
- Source: merged PR #124, `0efd91504ba21fc869f2ab17e7691f82a483eb34`.
- Previous: latest observed Worker version `8dff401d-baab-4948-84f3-e4a1311cb0bc`, deployed September 30. No automatic deployment appeared after this merge.
- Intended: documented manual build/publish of merged main; preserve current encrypted secrets and runtime variables. Hosting and Database Markdown remains in Git, while the application is rebuilt from that same source.
- Checks: all four merged-main CI jobs passed; frozen-lockfile install and full local build passed with zero errors/warnings (14 existing hints).
- Rollback: restore the previous Worker version with current provider state; code rollback does not restore KV or other persisted stores.
- Verification: deployment version receipt, public home/MCP retirement health, and anonymous Harness/Ledger access boundaries.

- Deployed: Cloudflare Worker version `6a2c4b99-6f37-4b28-aff5-b55a62ef2b56`.

## Intent

Publish merged audit documentation source through the established website release path. Preserve the retired original MCP and current Azure proxy targets.

## Outcome

Manual `wrangler deploy --strict --keep-vars` succeeded with the full merged source revision in its deployment message. Cloudflare reported no changed static assets. Existing secrets and variables were preserved. Follow-up probes confirmed the expected public and anonymous-access behavior.

## Rollback

Restore the Previous Worker version with current provider state; code rollback does not restore KV or other persisted stores.
