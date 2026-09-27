# Re-vendor Moss at the live verified revision

- Status: applied
- Verified: partly
- Checked: vendored Moss `315dc3c87e95673a39f128f89e3a5f92853d57cf` from a clean temporary source checkout; `bun run build` passed locally; PR checks passed; Cloudflare Worker deployed version `622cbc18-5099-4bf4-9190-aa53ebeb5aa9`; live `/mcp/health` returned OK; one live `get_guidance` call returned deterministic Bicep review guidance from deployed version `622cbc18-5099-4bf4-9190-aa53ebeb5aa9`
- Not checked: persisted Bstack event ingestion, because `BSTACK_TOOLS_EVENT_TOKEN` is not configured yet; Jev shadow event payload visibility in the feedback store, because the receiver is protected and no event report exists yet
- When (UTC): 2026-09-27T12:46:54Z
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` static assets for `https://brandoriv.dev/mcp` and `https://brandoriv.dev/moss`
- Previous: vendored Moss revision `6825c69b0846df1e6dd3b691f1025fddb775d2be`
- Deployed: Cloudflare Worker version `622cbc18-5099-4bf4-9190-aa53ebeb5aa9` with deploy-time `JEV_ROUTING_MODE=shadow` and `JEV_SEND_RAW_TASK=0`
- Operation: mcp-moss-315dc3c-revendor-and-jev-shadow-deploy

## Intent

The production deploy gate checks the vendored Moss catalog against the live verified Moss release. The deployment attempt was blocked because the repository still vendored `6825c69b0846df1e6dd3b691f1025fddb775d2be`, while live Moss reports `315dc3c87e95673a39f128f89e3a5f92853d57cf`.

Re-vendor the public Moss catalog and MCP dashboard runtime from Moss revision `315dc3c87e95673a39f128f89e3a5f92853d57cf`, update the dashboard pin to `v0.1.0-315dc3c`, then deploy the merged Jev shadow-routing Worker code with raw task text still disabled.

## Outcome

Merged through PR #106 and deployed to Cloudflare Worker version `622cbc18-5099-4bf4-9190-aa53ebeb5aa9`. The deployment used deploy-time vars to enable Jev shadow routing while keeping raw task text disabled. The committed `wrangler.jsonc` default remains `JEV_ROUTING_MODE=off`.

Live verification confirmed the MCP endpoint served the deployed Worker version and returned deterministic guidance for a Bicep review request. Event ingestion persistence remains incomplete until `BSTACK_TOOLS_EVENT_TOKEN` is configured.

## Rollback

Revert the generated Moss asset changes and restore the dashboard pin to `v0.1.0-6825c69`. If live Moss remains at `315dc3c87e95673a39f128f89e3a5f92853d57cf`, that rollback will intentionally make the live Moss consistency gate fail again.
