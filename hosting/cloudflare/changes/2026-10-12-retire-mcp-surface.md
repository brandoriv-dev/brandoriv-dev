# Remove the retired MCP surface and its policy binding from the shared Worker

- Status: planned
- Verified: not checked
- Checked: source only, locally: build, Worker type check, Ledger proxy tests, Moss gate tests and live-release check, Moss Playwright suite, and a route smoke against wrangler dev (`/` 200, `/moss/` 200 with security headers, `/moss` 308, POST `/moss/` 405, `/mcp` and `/mcp/*` 410, `/harness` 404, `/ledger` 503 without an origin).
- Not checked: production deployment, live route readback and the deployed Worker version; Brandon or the normal `deploy` job verifies them after merge. The KV namespace contents were not read or archived here.
- When (UTC): 2026-10-12
- Actor: Claude Code for Brandon Rivera
- Target: Cloudflare account 3d873c2936146d4f557d0c2b469f69ac, Worker brandoriv-dev, routes brandoriv.dev/mcp*, brandoriv.dev/ledger* and brandoriv.dev/moss*, KV binding MCP_POLICIES to namespace 06c32c63f1bd4f8494592661cedff41c, Worker vars MCP_RETIRED, JEV_*, TYPESAFE_* and BSTACK_TOOLS_EVENT_ENDPOINT
- Previous: source main 36b2430a0039f3d17aa9f016594fb1cf0ac5357b; live Worker version unrecorded
- Deployed: none

## Intent

Brandon officially retired `brandoriv.dev/mcp` and `/harness` on 2026-10-12. The
MCP had already been switched off on 2026-09-30
([retirement](2026-09-30-retire-original-mcp.md)): `MCP_RETIRED=true` returned 410
for every `/mcp` path, but the server, dashboard, policy store, Jev router and
their dependencies still shipped in the Worker, and the deploy job refused to
publish unless the `MCP_POLICIES` binding still matched.

This is a source-only change. It removes the MCP code, assets, scripts, the
manual `answer-study.yml` workflow and MCP-only dependencies, and makes the Worker:

- answer `/mcp` and `/mcp/*` with a hard-coded HTTP 410 tombstone. The
  `brandoriv.dev/mcp*` route and the `/mcp` `run_worker_first` entries are kept so
  the tombstone, not a static 404, answers old clients. The `MCP_RETIRED` var is
  removed;
- keep `/ledger` (proxy) and `/moss` (catalog, security headers, 405 for writes)
  unchanged;
- leave `/harness` without a handler: it was already removed from source by the
  [Terrarium retirement](2026-10-09-retire-terrarium-route.md) and returns 404.

`wrangler.jsonc` drops the `MCP_POLICIES` binding to KV namespace
`06c32c63f1bd4f8494592661cedff41c`, the Jev, TypeSafe and bstack.tools vars, and
the Markdown text rule. The namespace itself is retained: archiving and deleting
its data is a separate, coordinator-run operation that needs its own record. The
deploy-time guard that aborted when the binding differed is removed, because the
next deployment removes that binding by design.

The five ruleset-required CI contexts keep their names. `Policy and dashboard
checks` and `MCP smoke test` now run the Worker type check, Ledger and Moss tests,
and the route smoke; the browser job tests `/moss` without MCP sign-in.

The Worker deploy happens through the normal `deploy` job in `ci.yml` after merge.
No Cloudflare, Azure or GitHub setting was changed by this work.

## Outcome

Pending merge and the normal passing-main deployment. Afterwards, record the
deployed Worker version and a readback that `/mcp` and `/mcp/x` return 410, the
Worker settings no longer list `MCP_POLICIES` or the removed vars, and the KV
namespace still exists until its archive operation runs.

## Rollback

Redeploy the previous Worker version, which carries its own assets and the
`MCP_POLICIES` binding to the retained namespace. Because the namespace is not
deleted here, a rollback restores the binding without data loss.
