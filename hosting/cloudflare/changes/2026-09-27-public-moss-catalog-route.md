# Make the Moss catalog public on the custom domain

- Status: applied
- Verified: partly
- Checked: `bun run build` passed; `bunx playwright test --config playwright.mcp.config.mjs tests/browser/moss-catalog.spec.mjs` passed against local Wrangler; production `https://brandoriv.dev/moss`, `/moss/vendor.json`, and `/moss/src/vendor/echarts.esm.min.js` returned `200`
- Not checked: live authenticated MCP dashboard contents were not inspected
- When (UTC): 2026-09-27T12:46:12Z
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` route `https://brandoriv.dev/moss`
- Previous: anonymous `/moss` requests returned `302 Location: /mcp?next=%2Fmoss`
- Deployed: Cloudflare Worker version `3e6de9a6-0595-4f30-9d27-3ba3a7da4e46`
- Operation: mcp-public-moss-catalog-route

## Intent

The live Moss Function App now allows anonymous catalog files, but the custom
domain Worker still treated `/moss` as an MCP dashboard child route and required
a signed dashboard session before serving the vendored static assets.

Serve `/moss` through the existing Worker asset binding without the MCP dashboard
session check. Keep `/mcp`, `/harness`, and `/ledger` on their existing
authentication and proxy boundaries.

## Outcome

PR #105 merged at `e549b7b8f59cfbc0e501a356bf1e3732d94ab7a0`, main CI
passed, and `bun run deploy` published Worker version
`3e6de9a6-0595-4f30-9d27-3ba3a7da4e46`.

Local Worker rendering serves anonymous `/moss/`, `/moss/vendor.json`, ECharts,
and Geist CSS with `200` responses. Production `https://brandoriv.dev/moss`,
`/moss/vendor.json`, and `/moss/src/vendor/echarts.esm.min.js` also returned
`200`, and the live vendor record reports Moss revision
`315dc3c87e95673a39f128f89e3a5f92853d57cf`. The in-app browser opened
`https://brandoriv.dev/moss#main` as `Moss - Component catalog`.

## Rollback

Restore the `serveMossCatalog` dashboard-session guard and browser expectation
that anonymous `/moss` assets redirect to `/mcp?next=%2Fmoss`, then redeploy the
Worker.
