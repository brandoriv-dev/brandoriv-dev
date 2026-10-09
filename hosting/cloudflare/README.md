# Cloudflare

Current state of the Cloudflare resources this repository owns. Facts come from
`wrangler.jsonc` and the linked records. Values no record establishes are marked
unknown. Out-of-band operations are journaled in [changes](changes/README.md).

- Account: `3d873c2936146d4f557d0c2b469f69ac` ([2026-09-26 record](changes/2026-09-26-moss-catalog-promotion.md)).
- Worker: `brandoriv-dev`, entry `mcp/worker.ts`, static assets from `./dist` bound as `ASSETS`.
- Zone and source routes: `brandoriv.dev`; `brandoriv.dev/mcp*`, `/ledger*` and
  `/moss*` run the Worker first. Other paths are served as static site assets.
- `/mcp`: retired. `MCP_RETIRED` is `true` and every MCP path returns HTTP 410
  ([2026-09-30 retirement](changes/2026-09-30-retire-original-mcp.md)).
- `/ledger`: proxies to the Azure origin in `LEDGER_ORIGIN`.
  That Function App belongs to another repository; see the
  [Azure ownership register](../azure/2026-10-03-ownership-register.md).
- Terrarium's repository, Azure resources and identity were deleted on 2026-10-09.
  The `/harness` upstream and route are removed from source; production removal
  remains pending the normal passing-main deployment and route readback
  ([retirement plan](changes/2026-10-09-retire-terrarium-route.md)).
- `/moss`: the vendored Moss catalog, verified against the live Azure Moss release by
  `bun run moss:live`.
- KV: namespace `brandoriv-dev-mcp-policies`, ID `06c32c63f1bd4f8494592661cedff41c`,
  bound as `MCP_POLICIES`. `wrangler.jsonc` explicitly preserves this existing
  namespace ([v1.9.0 deployment](changes/2026-09-19-v1.9.0-deployment.md)). Archived
  policy data was kept when the MCP was retired.
- Secrets: the Worker secret list was empty after the
  [2026-09-30 credential cleanup](changes/2026-09-30-clean-retired-mcp-cloud-resources.md).
- Latest recorded Worker version: `3c916fd6-6bd9-4cf5-a6e1-ea0b598e97d2`
  ([2026-10-03 Moss release synchronization](changes/2026-10-03-moss-release-synchronization.md)).
  Routine deployments are not journaled, so later versions may exist.
- Deployment path: `.github/workflows/ci.yml` is prepared to check and deploy
  passing current-main commits from the device through the production environment.
  The existing Workers Builds integration will be retired after a verified
  device deployment. The
  [2026-10-03 audit documentation release](changes/2026-10-03-audit-docs-release.md)
  observed no automatic deployment after its merge and published with Wrangler.
- Environments: production only is recorded. Other environments: unknown.
- IaC: `wrangler.jsonc` at the repository root.
