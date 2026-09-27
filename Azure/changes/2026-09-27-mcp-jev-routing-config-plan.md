# Prepare Azure source of truth for MCP Jev routing configuration

- Status: planned
- Verified: not checked
- Checked: repository runtime wiring was inspected; a non-mutating MCP config audit was added to validate committed Worker vars and optionally live Cloudflare secret names without printing values; no Azure CLI mutation was performed
- Not checked: Azure Key Vault secret creation, Azure App Configuration updates, live Cloudflare secret presence, and Cloudflare mirroring because Brandon will add the TypeSafe key and apply external configuration
- When (UTC): 2026-09-27
- Actor: Codex for Brandon Rivera
- Target: Azure Key Vault secret `TYPESAFE_API_KEY`; Azure App Configuration keys `JEV_ROUTING_MODE`, `TYPESAFE_ENDPOINT`, `TYPESAFE_MODEL`, `JEV_ROUTE_THRESHOLD`, `JEV_SEND_RAW_TASK`, `JEV_TIMEOUT_MS`, `BSTACK_TOOLS_EVENT_ENDPOINT`; Cloudflare Worker `brandoriv-dev` mirror settings for `https://brandoriv.dev/mcp`
- Previous: no recorded Azure source-of-truth settings for MCP Jev routing
- Deployed: pending
- Operation: mcp-jev-shadow-routing-logging

## Intent

Use Azure Key Vault for the TypeSafe/Jev API key and Azure App Configuration for non-secret Jev and event logging settings, while keeping the Cloudflare Worker runtime unchanged: it reads Worker vars and secrets at request time. The Azure values are the external source of truth; deployment automation or an operator must mirror them into Cloudflare before enabling shadow routing.

Do not add always-on cross-cloud sync yet. The current deployment path is Cloudflare Workers Builds, not GitHub Actions, and copying secrets through a new CI path would expand the trust boundary before Jev routing has proved it needs automation. The smallest safe bridge is an explicit manual mirror plus `bun run mcp:config-audit` for committed defaults and `bun run mcp:config-audit:live` for Cloudflare secret-name presence when an authenticated operator runs it.

The intended safe starting values are:

- `JEV_ROUTING_MODE=off`
- `TYPESAFE_ENDPOINT=https://api.typesafe.ai/v1/systemone`
- `TYPESAFE_MODEL=jev-latest`
- `JEV_ROUTE_THRESHOLD=0.65`
- `JEV_SEND_RAW_TASK=0`
- `JEV_TIMEOUT_MS=1500`
- `BSTACK_TOOLS_EVENT_ENDPOINT=https://bstack.tools/api/v0/feedback`

Do not record the `TYPESAFE_API_KEY` value, event logging bearer token, CLI exports, or portal screenshots containing secrets.

## Outcome

Pending. Brandon will add the TypeSafe key and complete the external configuration.

## Rollback

Set `JEV_ROUTING_MODE=off` in App Configuration and in the Cloudflare Worker mirror. If needed, delete or disable the Key Vault secret version and remove the mirrored Worker secret.
