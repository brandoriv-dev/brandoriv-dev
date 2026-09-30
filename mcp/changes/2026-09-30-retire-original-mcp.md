# Retire the original MCP endpoint

- Status: planned
- Verified: not checked
- Checked: Production health returned HTTP 200 before the operation; repository inspected against current origin/main.
- Not checked: Deployment and retirement verification have not run yet.
- When (UTC): 2026-09-30
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker brandoriv-dev; brandoriv.dev/mcp and all /mcp/ subroutes
- Previous: To be captured from Cloudflare before deployment
- Deployed: No retirement deployment yet

## Intent

Brandon requested taking the original MCP offline because brandoriv.dev/mcp should no longer be in use. Set MCP_RETIRED=true and reject all MCP paths and methods with HTTP 410 before authentication, dashboard mutation, or MCP execution. Retain the shared Worker, other routes, stored policies, and secrets.

## Outcome

Prepared for deployment; live outcome will be recorded after publication.

## Rollback

Set MCP_RETIRED=false and redeploy. The policy namespace and credentials are retained.
