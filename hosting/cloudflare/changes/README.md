# Cloudflare Worker external changes

This journal records operations outside Git on the Cloudflare Worker `brandoriv-dev`
and the `brandoriv.dev` routes it serves. It merges two former component journals,
`mcp/changes/` and `harness/changes/`, because both recorded the same Worker; record
file names are unchanged. Current state is summarized in [../README.md](../README.md).

## MCP (`/mcp`, and the `/moss` catalog it vendors)

Record operations outside Git that affect `https://brandoriv.dev/mcp`: Cloudflare
publication and secrets, Entra application configuration, redirect URIs, account
allowlists, DNS/routes, and recovery actions. Source-only policy edits already have
Git history; record their publication here when it changes the deployed service.

## Harness (`/harness`)

Record operations affecting `https://brandoriv.dev/harness`: website proxy
publication, Cloudflare route/variable changes, authentication callbacks, and
cross-repository coordination with the Azure control plane. The application source
lives in the sibling `agent-harness` repository. Link the backend repository's
authoritative Azure record when an operation spans both repositories. Keep dashboard
policy, worker permission, and workstation scheduler changes in the repository that
owns them and link them here only when the public route is affected. Routine task
and heartbeat events remain in Harness state and telemetry.

## Recording

Use the [shared convention](../../README.md) and
[template](../../change-template.md). Add a
`YYYY-MM-DD-short-description.md` entry with actual UTC event time, actor, target,
source/action reference, observed outcome, validation evidence, rollback, and any
configuration drift. Record failed and partial operations as well as successful
ones. Distinguish configured intent, attempted operations, and verified live
behavior. Use links to the authoritative Azure or Harness record for shared
operations instead of duplicating them.

For credential changes, record setting names such as `MCP_BEARER_TOKEN` or
`MICROSOFT_CLIENT_SECRET`, the reason, and the result. Never record their values,
authenticated Connect-view contents, session cookies, or full token responses.

<!-- records:begin -->
- [Re-vendor Moss at the live verified revision 637ef50](2026-10-06-moss-637ef50-revendor.md)
- [Re-vendor Moss at the live verified revision 48a7082](2026-10-06-moss-48a7082-revendor.md)
- [Synchronize the website with the deployed Moss revision](2026-10-03-moss-release-synchronization.md)
- [Publish the audit documentation baseline](2026-10-03-audit-docs-release.md)
- [Retire the original MCP endpoint](2026-09-30-retire-original-mcp.md)
- [Clean up retired MCP cloud credentials](2026-09-30-clean-retired-mcp-cloud-resources.md)
- [Publish the Moss dashboard overhaul on the custom domain](2026-09-28-moss-dashboard-overhaul-revendor.md)
- [Make the Moss catalog public on the custom domain](2026-09-27-public-moss-catalog-route.md)
- [Publish MossLayout in the custom-domain Moss catalog](2026-09-27-moss-69809a9-revendor.md)
- [Re-vendor Moss at the live verified revision](2026-09-27-moss-6825c69-revendor.md)
- [Re-vendor Moss at the live verified revision](2026-09-27-moss-315dc3c-revendor.md)
- [Add Jev shadow routing and Bstack event logging configuration](2026-09-27-jev-shadow-routing-and-logging-plan.md)
- [Publish the verified neutral Moss catalog on the custom domain](2026-09-26-moss-catalog-promotion.md)
- [Publish the Control Room MCP dashboard](2026-09-24-control-room-dashboard.md)
- [Publish MCP policy provenance and capability inventory](2026-09-23-policy-provenance-inventory.md)
- [Publish the paged Moss component catalog](2026-09-23-moss-category-pages-deployment.md)
- [Re-vendor both Moss surfaces at the chrome-sizing revision](2026-09-23-moss-catalog-sizing-revendor.md)
- [Publish the MCP policy-routing redesign](2026-09-23-mcp-policy-routing-redesign.md)
- [Converge the MCP dashboard on Moss primitives](2026-09-23-mcp-dashboard-convergence.md)
- [Bullfrog dashboard rewrite deployment](2026-09-23-bullfrog-ui-deployment.md)
- [Green tree frog MCP theme](2026-09-22-treefrog-theme.md)
- [Deploy the MossTheme values catalog](2026-09-22-moss-theme-values-catalog.md)
- [Deploy theme-owned catalog density](2026-09-22-moss-theme-owned-density.md)
- [Publish the Moss table query components](2026-09-22-moss-table-query-parts.md)
- [Publish Moss review fixes and theme toggle](2026-09-22-moss-review-and-theme-toggle.md)
- [Correct authenticated Moss directory redirect](2026-09-22-moss-directory-redirect-correction.md)
- [Move the MCP dashboard's Moss pin to 3020636](2026-09-22-moss-dashboard-pin-3020636.md)
- [Moss dashboard migration plan](2026-09-22-moss-dashboard-migration-plan.md)
- [Re-vendor the authenticated Moss catalog at Moss 3020636](2026-09-22-moss-catalog-revendor.md)
- [Host the private Moss catalog behind dashboard authentication](2026-09-22-moss-catalog-hosting.md)
- [Deploy the Moss 0.3 catalog](2026-09-22-moss-0.3-catalog.md)
- [Draw every MCP dashboard icon through the Moss contract](2026-09-22-dashboard-single-icon-contract.md)
- [Dashboard default: collapsed rail and viewport fit (planned)](2026-09-22-dashboard-rail-fit-plan.md)
- [Ledger route on the website Worker](2026-09-21-ledger-proxy-plan.md)
- [Dashboard default rule and active-dashboard alignment plan](2026-09-21-dashboard-default-plan.md)
- [Dashboard default rule and MCP overview deployed](2026-09-21-dashboard-default-deployed.md)
- [Real model-answer quality study, plus a post-merge pipeline](2026-09-21-answer-study-pipeline.md)
- [MCP console v1.12: neutral surfaces, collapsed policies, notification bell](2026-09-20-v1.12-neutral-console.md)
- [MCP v1.11.1 flat mascot refinement](2026-09-20-v1.11.1-flat-mascot-refinement-plan.md)
- [MCP v1.11.1 flat mascot refinement deployment outcome](2026-09-20-v1.11.1-flat-mascot-refinement-deployed.md)
- [MCP v1.11 mascot brand refresh deployment outcome](2026-09-20-v1.11-mascot-brand-refresh-deployed.md)
- [Dashboard family: antagonistic review and cohesion plan](2026-09-20-dashboard-family-plan.md)
- [MCP v1.9.0 deployment](2026-09-19-v1.9.0-deployment.md)
- [MCP v1.9 and frog icon integration plan](2026-09-19-v1.9-icon-integration-plan.md)
- [MCP v1.9 icon integration deployment](2026-09-19-v1.9-icon-integration-deployed.md)
- [MCP v1.11 mascot brand refresh](2026-09-19-v1.11-mascot-brand-refresh-plan.md)
- [MCP v1.10 dashboard refinement deployment](2026-09-19-v1.10-dashboard-refinement-plan.md)
- [MCP v1.10 dashboard refinement deployment outcome](2026-09-19-v1.10-dashboard-refinement-deployed.md)
- [Versioned policy storage — planned operation](2026-09-19-policy-storage-plan.md)
- [MCP frog icon deployed](2026-09-19-mcp-icon-deployed.md)
- [Frontend design guidance and policy-tree UI deployment](2026-09-19-frontend-design-guidance-plan.md)
- [Frontend design guidance and policy-tree UI deployment outcome](2026-09-19-frontend-design-guidance-deployed.md)
- [Project contract guidance publication plan](2026-09-14-project-contract-guidance-plan.md)
- [Project contract guidance deployed](2026-09-14-project-contract-guidance-deployed.md)
- [MCP frog icon publication plan](2026-09-14-mcp-icon-plan.md)
- [Material dark theme and mobile navigation deployed](2026-09-14-material-dark-theme-deployed.md)
- [Grill-me guidance publication plan](2026-09-14-grill-me-plan.md)
- [Grill-me guidance deployed](2026-09-14-grill-me-deployed.md)
- [Refine MCP typography](2026-09-14-dashboard-typography-plan.md)
- [Dashboard typography deployed](2026-09-14-dashboard-typography-deployed.md)
- [Refine MCP hierarchy and dark theme](2026-09-13-material-dark-theme-plan.md)
- [Add dark mode to the MCP page](2026-09-13-dark-mode-plan.md)
- [Shared dashboard theme deployed](2026-09-13-dark-mode-deployed.md)
- [Preserve Azure's browser login nonce](2026-09-12-login-nonce.md)
- [Browser nonce fix deployed](2026-09-12-login-deployed.md)
- [MCP authentication configuration baseline](2026-09-12-authentication-baseline.md)
- [Publish the Harness route and fix its Worker cache options](2026-09-11-azure-route.md)
<!-- records:end -->
