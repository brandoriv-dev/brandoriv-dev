# Clean up retired MCP cloud credentials

- Status: planned
- Verified: not checked
- Checked: Entra app is named brandoriv.dev MCP dashboard and has only the retired callback; no service principal found; active Azure subscription returned no MCP-named resources.
- Not checked: Cleanup and provider readback have not run yet.
- When (UTC): 2026-09-30
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev`; Entra application `2cf1ac79-78e8-4327-afcd-8bb5110c2bb3`, client ID `e9532d95-f974-4d3e-87d3-df451284981c`
- Previous: Entra app has one password credential and the retired callback; Worker has four MCP secrets.
- Deployed: Cleanup not applied yet

## Intent

Brandon requested cloud cleanup following original MCP retirement. Remove the dedicated Entra app and Cloudflare secrets MCP_BEARER_TOKEN, MICROSOFT_CLIENT_SECRET, TYPESAFE_API_KEY, and BSTACK_TOOLS_EVENT_TOKEN. Remove obsolete identity vars from source. Keep the Worker and shared Harness, Ledger, and Moss routes, the 410 retirement route, and archived policy KV data. Typesafe and feedback credentials are removed from this Worker only, not revoked in their external systems where other clients may use them.

## Outcome

Prepared for execution.

## Rollback

Deleted credentials are not recoverable from this journal. Restoring authentication requires a new Entra registration and newly issued credentials. Archived policy data remains available.
