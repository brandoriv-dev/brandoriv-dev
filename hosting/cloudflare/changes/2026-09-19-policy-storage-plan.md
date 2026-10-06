# Versioned policy storage — planned operation

- Intended UTC date: 2026-09-19
- Actor: Codex on Brandon's behalf
- Target: Cloudflare KV namespace bound to `MCP_POLICIES` for the `brandoriv-dev` Worker
- Purpose: Persist immutable policy versions and the active-version pointer created from the authenticated MCP dashboard.
- Source revision: local `dashboard-token-connect` working tree; deployment is not part of this operation.
- Verification: create the namespace, record its identifier in `wrangler.jsonc`, run the complete local build, and leave production unchanged until a separate deployment.
- Rollback: remove the binding from `wrangler.jsonc`; delete the namespace separately only after confirming it contains no wanted policy history.
- Expected drift: the namespace will exist before the Worker binding is deployed.

## Attempt outcome

- UTC date: 2026-09-19
- Result: failed; no namespace was created and no live configuration changed.
- Evidence: Wrangler returned Cloudflare API authentication error `10000` while creating `MCP_POLICIES`.
- Follow-up: the source configuration now uses Wrangler's ID-less automatic provisioning for `MCP_POLICIES`. Authenticate Wrangler, then deploy and smoke-test as a separately recorded operation; the deploy should create the namespace and write its identifier back to configuration.
