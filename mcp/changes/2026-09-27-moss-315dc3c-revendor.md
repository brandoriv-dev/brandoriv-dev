# Re-vendor Moss at the live verified revision

- Status: planned
- Verified: not checked
- Checked: vendored Moss `315dc3c87e95673a39f128f89e3a5f92853d57cf` from a clean temporary source checkout
- Not checked: `bun run build`, production deployment, and live `/mcp/health` are pending
- When (UTC): 2026-09-27
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` static assets for `https://brandoriv.dev/mcp` and `https://brandoriv.dev/moss`
- Previous: vendored Moss revision `6825c69b0846df1e6dd3b691f1025fddb775d2be`
- Deployed: pending
- Operation: mcp-moss-315dc3c-revendor-and-jev-shadow-deploy

## Intent

The production deploy gate checks the vendored Moss catalog against the live verified Moss release. The deployment attempt was blocked because the repository still vendored `6825c69b0846df1e6dd3b691f1025fddb775d2be`, while live Moss reports `315dc3c87e95673a39f128f89e3a5f92853d57cf`.

Re-vendor the public Moss catalog and MCP dashboard runtime from Moss revision `315dc3c87e95673a39f128f89e3a5f92853d57cf`, update the dashboard pin to `v0.1.0-315dc3c`, then deploy the merged Jev shadow-routing Worker code with raw task text still disabled.

## Outcome

Pending build, merge, and deployment.

## Rollback

Revert the generated Moss asset changes and restore the dashboard pin to `v0.1.0-6825c69`. If live Moss remains at `315dc3c87e95673a39f128f89e3a5f92853d57cf`, that rollback will intentionally make the live Moss consistency gate fail again.
