# Deploy the MCP retirement and delete the empty policy KV namespace

- Status: applied
- Verified: partly
- Checked: main CI run 38258055202 passed all five required jobs, and its deploy job published Worker version `10ba2a08-ead0-4414-919a-f609b181aaae` from merge `1a383f7702d42cb845f454db732084e908e89252`, whose bindings are only `ASSETS` and `LEDGER_ORIGIN`. A live readback showed `/` 200, `/moss/` 200 with CSP/nosniff/DENY headers, `/moss` 308, `/mcp` and `/mcp/health` 410, `/harness` 404 and `/ledger` 401. Before the deletion, a fresh API read found that no Worker binds namespace `06c32c63f1bd4f8494592661cedff41c`, there are no Pages projects, and the namespace held 0 keys. After the deletion it is absent from the namespace list and the routes are unchanged.
- Not checked: DNS records, because the Wrangler OAuth scopes do not include DNS read (HTTP 403); where any older "archived policy data" lives, because the namespace was already empty.
- When (UTC): 2026-10-12T22:26:44Z
- Actor: Claude Code for Brandon Rivera
- Target: Cloudflare account `3d873c2936146d4f557d0c2b469f69ac`, Worker `brandoriv-dev`, KV namespace `brandoriv-dev-mcp-policies` (`06c32c63f1bd4f8494592661cedff41c`), routes `brandoriv.dev/mcp*`, `brandoriv.dev/ledger*`, `brandoriv.dev/moss*`
- Previous: Worker bound `MCP_POLICIES` to the namespace; source change in [2026-10-12 retire MCP surface](2026-10-12-retire-mcp-surface.md)
- Deployed: Worker version `10ba2a08-ead0-4414-919a-f609b181aaae` (normal `deploy` job); KV namespace deleted through the Cloudflare API

## Intent

This completes the [2026-10-12 source change](2026-10-12-retire-mcp-surface.md) after Brandon officially retired `brandoriv.dev/mcp`. The normal deployment removed the `MCP_POLICIES` binding. The namespace it pointed to was then deleted, because the MCP is retired and the namespace had no binding and no keys. The [2026-09-30 cleanup](2026-09-30-clean-retired-mcp-cloud-resources.md) said archived policy data remained. By this operation the namespace was already empty, so no data was archived or lost here. The policy definitions remain in this repository's Git history (`mcp/preferences*` before #161).

## Outcome

Applied. The production Worker serves the portfolio, the `/moss` catalog and the `/ledger` proxy as before, with a hard-coded 410 for `/mcp*` and 404 for `/harness`. The external receipt is `third-pass-mcp-policies-kv-receipt.json` in the 2026-10-12 cleanup artifacts, outside Git.

## Rollback

Redeploying an older Worker version that still declares `MCP_POLICIES` now fails, because the namespace is gone. Fix forward instead. A retired MCP would need a new namespace and a source change; the deleted namespace held no keys.
