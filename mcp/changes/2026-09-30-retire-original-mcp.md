# Retire the original MCP endpoint

- Status: applied
- Verified: checked
- Checked: Full build passed; 12 live MCP path/method checks returned HTTP 410; root returned 200, Moss 308, Harness 401, and Ledger 401 as before; Cloudflare reported no asset changes.
- Not checked: nothing
- When (UTC): 2026-09-30T21:53:56Z
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker brandoriv-dev; brandoriv.dev/mcp and all /mcp/ subroutes
- Previous: Cloudflare Worker version c8b91db6-69b9-415a-9d49-5948870bb9c1
- Deployed: Cloudflare Worker version 91757506-13f7-4945-93be-c3dd8b78d652
- Source: a42d705; WorkspaceManager task 73e380cb00f8426f86f25cbf61f71a07

## Intent

Brandon requested taking the original MCP offline because brandoriv.dev/mcp should no longer be in use. Set MCP_RETIRED=true and reject all MCP paths and methods with HTTP 410 before authentication, dashboard mutation, or MCP execution. Retain the shared Worker, other routes, stored policies, and secrets.

## Outcome

Published the retirement with wrangler deploy --keep-vars. All tested MCP requests returned 410, including transport methods, health, authentication, mutation endpoints, dashboard documents, and static assets. Other route status codes were unchanged. No updated assets were uploaded; the existing policy namespace and secrets were retained. CI explicitly overrides MCP_RETIRED=false to keep testing the dormant implementation.

## Rollback

Set MCP_RETIRED=false and redeploy. The policy namespace and credentials are retained.
