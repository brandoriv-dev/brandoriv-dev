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
  bound as `MCP_POLICIES`. `wrangler.jsonc` explicitly preserves this existing
  namespace ([v1.9.0 deployment](changes/2026-09-19-v1.9.0-deployment.md)). Archived
  policy data was kept when the MCP was retired.
- Secrets: the Worker secret list was empty after the
  [2026-09-30 credential cleanup](changes/2026-09-30-clean-retired-mcp-cloud-resources.md).
- Latest verified Worker version: `3b2332ed-55e0-4dc0-ace7-fb33c0aa5fa3`,
  deployment `8934910a-de5d-4d50-905c-2385979a07f0` from main source
  `340d3b35ecf0358009f40ac09fc2da1896f533d1` at 100 percent
  ([device deployment](changes/2026-10-07-device-deployment.md)).
- Deployment path: `.github/workflows/ci.yml` checks owner changes on Brandon's
  device and deploys passing current-main commits through the GitHub production
  environment, restricted to `main`. Its `CLOUDFLARE_API_TOKEN` secret holds a
  token limited to the account and `brandoriv.dev` zone. The former Workers Builds
  Git repository connection was retired after the verified device deployment;
  historic builds and the previous build token were preserved.
- Environments: production only is recorded. Other environments: unknown.
- IaC: `wrangler.jsonc` at the repository root.
