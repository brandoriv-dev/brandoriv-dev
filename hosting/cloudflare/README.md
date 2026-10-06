# Cloudflare

Current state of the Cloudflare resources this repository owns. Facts come from
`wrangler.jsonc` and the linked records. Values no record establishes are marked
unknown. Out-of-band operations are journaled in [changes](changes/README.md).

- Account: `3d873c2936146d4f557d0c2b469f69ac` ([2026-09-26 record](changes/2026-09-26-moss-catalog-promotion.md)).
- Worker: `brandoriv-dev`, entry `mcp/worker.ts`, static assets from `./dist` bound as `ASSETS`.
- Zone and routes: `brandoriv.dev`; `brandoriv.dev/mcp*`, `/harness*`, `/ledger*` and
  `/moss*` run the Worker first. Other paths are served as static site assets.
- `/mcp`: retired. `MCP_RETIRED` is `true` and every MCP path returns HTTP 410
  ([2026-09-30 retirement](changes/2026-09-30-retire-original-mcp.md)).
- `/harness` and `/ledger`: proxies to the Azure origins in `HARNESS_ORIGIN` and
  `LEDGER_ORIGIN`. Those Function Apps belong to other repositories; see the
  [Azure ownership register](../azure/2026-10-03-ownership-register.md).
- `/moss`: the vendored Moss catalog, verified against the live Azure Moss release by
  `bun run moss:live`.
- KV: namespace `brandoriv-dev-mcp-policies`, ID `06c32c63f1bd4f8494592661cedff41c`,
  bound as `MCP_POLICIES`. `wrangler.jsonc` keeps the ID-less auto-provisioning
  binding ([v1.9.0 deployment](changes/2026-09-19-v1.9.0-deployment.md)). Archived
  policy data was kept when the MCP was retired.
- Secrets: the Worker secret list was empty after the
  [2026-09-30 credential cleanup](changes/2026-09-30-clean-retired-mcp-cloud-resources.md).
- Latest recorded Worker version: `3c916fd6-6bd9-4cf5-a6e1-ea0b598e97d2`
  ([2026-10-03 Moss release synchronization](changes/2026-10-03-moss-release-synchronization.md)).
  Routine deployments are not journaled, so later versions may exist.
- Deployment path: Cloudflare Workers Builds deploys `main` (see `AGENTS.md`), and
  `.github/workflows/ci.yml` is a verification gate that does not deploy. The
  [2026-10-03 audit documentation release](changes/2026-10-03-audit-docs-release.md)
  observed no automatic deployment after its merge and published with Wrangler.
- Environments: production only is recorded. Other environments: unknown.
- IaC: `wrangler.jsonc` at the repository root.
