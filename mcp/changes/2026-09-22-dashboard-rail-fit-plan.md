# Dashboard default: collapsed rail and viewport fit (planned)

## Intended operation

- Intended UTC date: on merge of `dashboard-rail-fit`
- Actor: Brandon; Cloudflare auto-deploy on `main`
- Target: MCP preference `mcp/preferences/dashboard-default.md` (served through `get_guidance` / `get_preferences`)
- Purpose: Brandon's standing rule for every dashboard — the navigation rail starts collapsed and expands on demand; the first screen fits the desktop viewport with no page scrolling (panels scroll internally); phones stack and scroll normally. Ledger v1.3.0 applies it; Harness has not been updated yet.
- Source revision: this branch
- Pre-deployment verification: `mcp:policy-store-test`, `mcp:routing-test`, `mcp:dashboard-test`, and `mcp:policy-eval` pass locally
- Rollback: revert the commit; the policy store keeps prior versions

## Outcome

- Status: planned; not deployed.
