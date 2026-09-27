# Make the Moss catalog public on the custom domain

- Status: planned
- Verified: not checked
- Checked: `bun run build` passed; `bunx playwright test --config playwright.mcp.config.mjs tests/browser/moss-catalog.spec.mjs` passed against local Wrangler
- Not checked: Cloudflare production deployment because this branch has not merged yet
- When (UTC): 2026-09-27T12:35:42Z
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` route `https://brandoriv.dev/moss`
- Previous: anonymous `/moss` requests returned `302 Location: /mcp?next=%2Fmoss`
- Deployed: pending
- Operation: mcp-public-moss-catalog-route

## Intent

The live Moss Function App now allows anonymous catalog files, but the custom
domain Worker still treated `/moss` as an MCP dashboard child route and required
a signed dashboard session before serving the vendored static assets.

Serve `/moss` through the existing Worker asset binding without the MCP dashboard
session check. Keep `/mcp`, `/harness`, and `/ledger` on their existing
authentication and proxy boundaries.

## Outcome

Pending merge and Cloudflare deployment. Local Worker rendering serves anonymous
`/moss/`, `/moss/vendor.json`, ECharts, and Geist CSS with `200` responses.

## Rollback

Restore the `serveMossCatalog` dashboard-session guard and browser expectation
that anonymous `/moss` assets redirect to `/mcp?next=%2Fmoss`, then redeploy the
Worker.
