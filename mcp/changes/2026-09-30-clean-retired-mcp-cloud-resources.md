# Clean up retired MCP cloud credentials

- Status: applied
- Verified: checked
- Checked: Entra app query returned empty after deletion; Cloudflare secret list returned empty; Worker deploy omitted both identity vars; full build passed; MCP routes returned 410; root 200, Moss 308, Harness 401, and Ledger 401 unchanged.
- Not checked: nothing
- When (UTC): 2026-09-30T22:03:36Z
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev`; Entra application `2cf1ac79-78e8-4327-afcd-8bb5110c2bb3`, client ID `e9532d95-f974-4d3e-87d3-df451284981c`
- Previous: Worker version 91757506-13f7-4945-93be-c3dd8b78d652; Entra app 2cf1ac79-78e8-4327-afcd-8bb5110c2bb3 with one password credential.
- Deployed: Worker version 8dff401d-baab-4948-84f3-e4a1311cb0bc; Entra app absent; Worker secret list empty

## Intent

Brandon requested cloud cleanup following original MCP retirement. Remove the dedicated Entra app and Cloudflare secrets MCP_BEARER_TOKEN, MICROSOFT_CLIENT_SECRET, TYPESAFE_API_KEY, and BSTACK_TOOLS_EVENT_TOKEN. Remove obsolete identity vars from source. Keep the Worker and shared Harness, Ledger, and Moss routes, the 410 retirement route, and archived policy KV data. Typesafe and feedback credentials are removed from this Worker only, not revoked in their external systems where other clients may use them.

## Outcome

Deleted the dedicated Entra application and all four Worker secrets, then deployed without the obsolete identity vars. Archived policies and shared routes remain. The first secret-delete invocation rejected an unsupported --force option without changing state; retries succeeded. The Windows live-audit wrapper could not spawn bunx; direct Wrangler readback confirmed the empty secret list.

[Azure cross-link](../../Azure/changes/2026-09-30-retired-mcp-identity-cleanup.md).

## Rollback

Deleted credentials are not recoverable from this journal. Restoring authentication requires a new Entra registration and newly issued credentials. Archived policy data remains available.
