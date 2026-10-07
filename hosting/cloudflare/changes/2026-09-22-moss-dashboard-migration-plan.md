# Moss dashboard migration plan

- **Status:** Published to production with automated validation passed; authenticated visual inspection pending.
- **Intended target:** `https://brandoriv.dev/mcp`
- **Source design system:** `@brandoriv/moss` revision `e8e0f10`, vendored under the versioned public path `/mcp/moss/v0.1.0-e8e0f10/`.
- **Intended operation:** Publish the MCP dashboard with its product-specific `MossTheme`, balanced density, expandable persistent rail, shared component markers, and semantic-token bridge after review and merge.
- **Current external outcome:** Merged in PR #51 at `6accfe8d962201bfb9ac880c2d55977ad2d8283f` and deployed as Cloudflare Worker version `4a3845bf-4926-4305-80ec-f31121546d11` on 2026-09-22 UTC.
- **Verification:** MCP TypeScript, 36 authentication checks, 46 dashboard/catalog checks, the full policy/proxy suite, and Astro build passed. Anonymous `/moss` access redirects to the authenticated surface. Authenticated desktop/mobile light/dark review remains pending because this process had no production session credential.
- **Rollback if later published:** Revert the eventual migration merge and redeploy the preceding known-good `brandoriv-dev` revision.
- **Remaining difference from shared library:** The dashboard vendors browser-ready Moss assets because the Cloudflare static build does not currently install Moss as a package. MCP-specific policy-tree rendering and benchmark composition remain product-owned.
