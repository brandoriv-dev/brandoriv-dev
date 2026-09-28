# Publish the Moss dashboard overhaul on the custom domain

- Status: planned
- Verified: not checked
- Checked: local `npm run moss:check`, `npm run moss:test`, and `npm run mcp:dashboard-test` passed before publication.
- Not checked: Cloudflare production deployment and `https://brandoriv.dev/moss` live rendering are pending.
- When (UTC): 2026-09-28
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` static assets for `https://brandoriv.dev/moss` and `https://brandoriv.dev/mcp`
- Previous: vendored Moss revision `69809a9e772c7511b0b49018db0382447c979d98`
- Deployed: pending
- Operation: mcp-moss-76961ec-dashboard-overhaul-revendor

## Intent

Moss revision `76961ec97fba35c7ad8438ec2c87a4cd8d15266f` contains the component catalog dashboard overhaul and a packaging verification fix. The canonical Moss Azure Function reports that exact SHA live, but the custom-domain `https://brandoriv.dev/moss` route still serves the older vendored catalog from the Brandoriv Worker assets.

Re-vendor the Moss catalog and MCP dashboard runtime from the verified Moss revision, publish the Worker, and confirm the public custom-domain route shows the new hero and component-page model.

## Outcome

Pending publication.

## Rollback

Revert this re-vendor and restore the dashboard pin to `v0.1.0-69809a9`. That rollback returns `https://brandoriv.dev/moss` to the previous catalog copy while the standalone Moss Azure catalog remains on its own deployment.
