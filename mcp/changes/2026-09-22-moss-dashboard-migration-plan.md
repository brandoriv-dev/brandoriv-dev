# Moss dashboard migration plan

- **Status:** Implemented locally; not published.
- **Intended target:** `https://brandoriv.dev/mcp`
- **Source design system:** `@brandoriv/moss` revision `e8e0f10`, vendored under the versioned public path `/mcp/moss/v0.1.0-e8e0f10/`.
- **Intended operation:** Publish the MCP dashboard with its product-specific `MossTheme`, balanced density, expandable persistent rail, shared component markers, and semantic-token bridge after review and merge.
- **Current external outcome:** None. This branch has not been pushed or deployed and production remains unchanged.
- **Required verification before publication:** MCP TypeScript check, authentication tests, dashboard tests, full production build, authenticated desktop/mobile light/dark review, and deployed smoke verification.
- **Rollback if later published:** Revert the eventual migration merge and redeploy the preceding known-good `brandoriv-dev` revision.
- **Remaining difference from shared library:** The dashboard vendors browser-ready Moss assets because the Cloudflare static build does not currently install Moss as a package. MCP-specific policy-tree rendering and benchmark composition remain product-owned.
