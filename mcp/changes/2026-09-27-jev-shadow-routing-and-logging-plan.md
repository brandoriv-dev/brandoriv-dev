# Add Jev shadow routing and Bstack event logging configuration

- Status: planned
- Verified: not checked
- Checked: implementation is planned in this branch; no production configuration was changed
- Not checked: live Cloudflare deployment, live TypeSafe call from production, and Bstack event ingestion because this is a planned source/configuration change awaiting owner-provided secrets
- When (UTC): 2026-09-27
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev` route `https://brandoriv.dev/mcp`; settings `JEV_ROUTING_MODE`, `TYPESAFE_ENDPOINT`, `TYPESAFE_MODEL`, `JEV_ROUTE_THRESHOLD`, `JEV_SEND_RAW_TASK`, `JEV_TIMEOUT_MS`, `BSTACK_TOOLS_EVENT_ENDPOINT`, Cloudflare secrets `TYPESAFE_API_KEY` and `BSTACK_TOOLS_EVENT_TOKEN`
- Previous: Jev routing and Bstack event logging were not configured in the MCP Worker
- Deployed: pending
- Operation: mcp-jev-shadow-routing-logging

## Intent

Add guarded Jev shadow routing beside `get_guidance` without changing delivered guidance. Deterministic routing remains authoritative. Jev can be enabled only with `JEV_ROUTING_MODE=shadow`, and raw task text is withheld unless `JEV_SEND_RAW_TASK=1` is explicitly configured.

Add a reusable event logging surface for Jev now and future Bstack events such as `bstack.tools/api/v0/visualize` and `bstack.tools/api/v0/feedback`. Logs should carry category IDs, coarse input metadata, timing, usage, and mismatch summaries, not bearer tokens, cookies, or raw task text.

## Outcome

Pending. This record should be completed after deployment configuration is applied and verified.

## Rollback

Set `JEV_ROUTING_MODE=off` or remove `TYPESAFE_API_KEY` to stop Jev shadow calls without redeploying code. Remove `BSTACK_TOOLS_EVENT_ENDPOINT` to stop outbound event ingestion. A code rollback can remove the shadow modules, but the runtime flags are sufficient for immediate disablement.
