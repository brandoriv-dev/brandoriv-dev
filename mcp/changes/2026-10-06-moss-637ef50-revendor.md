# Re-vendor Moss at the live verified revision 637ef50

- Status: applied
- Verified: partly
- Checked: before merge, `node mcp/moss-catalog-check.mjs --against-live` verified 64 catalog and 35 dashboard assets at `637ef50bf3bd480ed321479b0d2eafaf6fcc69eb`, matching Azure production; `moss-catalog-test` (9 checks), `dashboard-test`, `bun run build` and all four PR #128 CI jobs passed, and `main` CI passed at the merge commit. After deploy, the public `https://brandoriv.dev/moss/vendor.json` reports revision `637ef50bf3bd480ed321479b0d2eafaf6fcc69eb`, home returns 200, `/moss` returns its 308 redirect and retired `/mcp` returns 410, as before.
- Not checked: real owner browser sign-in and authenticated catalog and dashboard interaction; Brandon can check them in a signed-in browser.
- When (UTC): 2026-10-06T13:06:47Z
- Actor: Claude Code for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` static assets for `https://brandoriv.dev/moss` and `https://brandoriv.dev/mcp`; Azure source `func-moss-7b5a92e0b4c1` in rg-moss.
- Previous: Worker version `3c916fd6-6bd9-4cf5-a6e1-ea0b598e97d2`; vendored Moss source `d2781e19c25458776efc0a6b3fd1fd0f41a71cbf`, dashboard pin `v0.1.0-d2781e1`.
- Deployed: Worker version `43ea3b8f-5ff0-46d3-b3c5-30c27dedfc13`; Moss source `637ef50bf3bd480ed321479b0d2eafaf6fcc69eb`.
- Source: website merged PR #128, `cd644089f3da121912b244cd5f9e705b7dc65b5d`.
- Operation: mcp-moss-637ef50-revendor

## Intent

Live Moss now reports `637ef50bf3bd480ed321479b0d2eafaf6fcc69eb` (Moss PR #46). The website's exact-live-release check therefore failed every build ("Stale Moss catalog"), including PR #127. Brandon authorized the re-vendor, merge and publication on 2026-10-06.

Vendored with `node mcp/vendor-moss.mjs` from a clean Moss checkout at the live revision, and moved the dashboard pin to `v0.1.0-637ef50`. Runtime asset contents are unchanged from `d2781e1`; only the provenance manifests and the pinned path change.

## Outcome

Merged #128 after all checks passed, then published the tested build of `cd64408` with `wrangler deploy --strict --keep-vars`. Existing variables, routes and the retired MCP response were preserved. Live catalog provenance matches Azure's exact SHA.

## Rollback

Restore the Previous Worker version only together with a compatible Moss pin: the prior website manifest intentionally fails the live-release check while Azure still reports `637ef50`. Prefer forward repair. The `v0.1.0-d2781e1` bundle stays in place.
