# Re-vendor Moss 2db1e7a, prune old dashboard pins and publish the hosting layout

- Status: applied
- Verified: partly
- Checked: `node mcp/moss-catalog-check.mjs --against-live` verified 59 catalog and 35 dashboard assets at `2db1e7aae6ef863d6c6b1b1afc6cddc6a5f275fa`, matching Azure production; `moss-catalog-test` (9 checks), `dashboard-test`, `harness:test` (14 cases), `changes:test` and `bun run build` passed locally, and all four PR #132 CI jobs passed. After deploy, the public `https://brandoriv.dev/moss/vendor.json` reports revision `2db1e7aae6ef863d6c6b1b1afc6cddc6a5f275fa`, home returns 200, `/moss` returns its 308 redirect, retired `/mcp` returns 410, and `/harness` and `/ledger` return 401 to anonymous requests, as before.
- Not checked: owner browser sign-in and authenticated catalog and dashboard interaction.
- When (UTC): 2026-10-06T14:31:28Z
- Actor: Claude Code for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` static assets for `https://brandoriv.dev/moss` and `https://brandoriv.dev/mcp`; Azure source `func-moss-7b5a92e0b4c1` in rg-moss.
- Previous: Worker version `f82bd13f-52cb-4903-80fc-c09ca8862f9e`; vendored Moss source `48a70824514ab5d090c347fd8de1186c80fb4bb0`, dashboard pin `v0.1.0-48a7082`; 21 dashboard pins in `public/mcp/moss/`.
- Deployed: Worker version `2954f833-bf1d-4494-adc4-06a2030247bd`; Moss source `2db1e7aae6ef863d6c6b1b1afc6cddc6a5f275fa`.
- Source: website merged PR #132, `e3e725d8cfa62e6c92709892773944a90d893a72`.
- Operation: mcp-moss-2db1e7a-revendor

## Intent

Brandon approved publishing the 2026-10-05 Workbench folder-structure cleanup on 2026-10-06. Its Moss part (Moss #49) deployed `2db1e7aae6ef863d6c6b1b1afc6cddc6a5f275fa`, so the website's exact-live-release check fails until the site vendors that revision. This change ships the website's own cleanup (records moved under `hosting/`, one duplicate icon removed) together with:

- the re-vendor of Moss `2db1e7a` (the catalog drops the 5 spike and screenshot files Moss #49 removed; dashboard runtime assets are unchanged), with the dashboard pin moved to `v0.1.0-2db1e7a`;
- removal of the 19 dashboard pins older than `v0.1.0-48a7082`, which Brandon approved. Only the current pin is referenced by code, `/mcp/*` is retired (410), and a pin-only revert already fails the live-release check. `mcp/vendor-moss.mjs` now says to keep the current and previous pins.

## Outcome

Merged #132 after all checks passed, then published the tested build of `e3e725d` with `wrangler deploy --strict --keep-vars`. Wrangler uploaded 4 changed assets. Existing variables, routes and the retired MCP response were preserved. Live catalog provenance matches Azure's exact SHA.

## Rollback

Restore the Previous Worker version, which carries its own static assets including the removed pins, only together with a compatible Moss release: while Azure reports `2db1e7a`, an older manifest intentionally fails the live-release check. The removed pins remain in Git history. Prefer forward repair.
