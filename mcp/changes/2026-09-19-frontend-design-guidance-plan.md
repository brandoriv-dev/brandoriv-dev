# Frontend design guidance and policy-tree UI deployment

- **Status:** Planned
- **Recorded on (UTC):** 2026-09-19
- **Actor:** Codex
- **Target:** Production MCP server and dashboard at `https://brandoriv.dev/mcp`
- **Planned operation:** Publish the routed `personal://frontend-design` policy, its Design catalog group, major-group UI descriptions, and accessible collapsible policy-tree branches. Merge through a pull request, deploy the merged `main` revision with the repository's Cloudflare workflow, and assess the live dashboard against the new frontend policy.
- **Source revision:** Branch `frontend-design-guidance`; exact merge revision pending.
- **Verification:** Required CI and full local build; authenticated production MCP smoke across supported protocol versions; dashboard API confirmation that the Design group and frontend policy are present; browser-width screenshots and interaction checks for group descriptions, tree expansion/collapse, keyboard focus, and mobile layout.
- **Rollback:** Redeploy the currently verified `main` revision `50d99035550e640253543684c9117580e7be9382`, then verify MCP health, dashboard authentication, tool catalog, and policy routing. The new policy contains no data migration and can be removed by reverting its merge commit.
- **Remaining differences from infrastructure code:** None planned. No DNS, secret, identity, Azure, or Cloudflare account configuration will change.

The completed operation record will preserve the merge revision, deployment identifier, UTC execution time, verification evidence, assessment findings, rollback status, and any remaining differences.
