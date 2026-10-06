# Re-vendor Moss at the live verified revision 637ef50

- Status: planned
- Verified: not checked
- Checked: `node mcp/moss-catalog-check.mjs --against-live` verified 64 catalog and 35 dashboard assets at `637ef50bf3bd480ed321479b0d2eafaf6fcc69eb`, matching Azure production; `node mcp/moss-catalog-test.mjs` (9 checks), `node mcp/dashboard-test.mjs` and `bun run build` passed locally.
- Not checked: production deployment, because this branch has not merged yet; owner browser sign-in and authenticated dashboard interaction.
- When (UTC): 2026-10-06
- Actor: Claude Code for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` static assets for `https://brandoriv.dev/moss` and `https://brandoriv.dev/mcp`; Azure source `func-moss-7b5a92e0b4c1` in rg-moss.
- Previous: vendored Moss source `d2781e19c25458776efc0a6b3fd1fd0f41a71cbf`, dashboard pin `v0.1.0-d2781e1`.
- Deployed: pending
- Operation: mcp-moss-637ef50-revendor

## Intent

Live Moss now reports `637ef50bf3bd480ed321479b0d2eafaf6fcc69eb` (Moss PR #46). The website's exact-live-release check therefore failed every build ("Stale Moss catalog"), including PR #127. Brandon authorized the re-vendor and merge on 2026-10-06.

Vendored with `node mcp/vendor-moss.mjs` from a clean Moss checkout at the live revision, and moved the dashboard pin to `v0.1.0-637ef50`. Runtime asset contents are unchanged from `d2781e1`; only the provenance manifests and the pinned path change.

## Outcome

Pending merge and deployment.

## Rollback

Restore the dashboard pin to `v0.1.0-d2781e1` and the previous `public/moss/vendor.json`. While Azure still reports `637ef50`, that rollback intentionally makes the live-release check fail again, so prefer forward repair. The `v0.1.0-d2781e1` bundle stays in place.
