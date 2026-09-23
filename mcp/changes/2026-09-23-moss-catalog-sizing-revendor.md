# Re-vendor the Moss catalog at the chrome-sizing revision

- Event time (UTC): 2026-09-23T01:22:00Z
- Recorded on (UTC): 2026-09-23T01:22:00Z
- Record type: contemporaneous
- Actor: Claude, working for the repository owner; Cloudflare Workers Builds
- Environment and targets: GitHub `BrandoRiv/brandoriv-dev`; Cloudflare Worker `brandoriv-dev`; authenticated route `/moss`
- Status: intended
- Source/action references: Moss revision `6b225b13ae73683ace93feab6b7d29127d3f2280` (`BrandoRiv/moss#12`)
- Related records: [category pages](2026-09-23-moss-category-pages-deployment.md); [catalog hosting](2026-09-22-moss-catalog-hosting.md); authoritative private-source record is in `BrandoRiv/moss` at `changes/2026-09-23-catalog-sizing-and-toolbar.md`

## Reason and change

Publish the Moss revision that sizes the catalog chrome from the applied theme.
Measured against the previously vendored catalog, the rail-to-topbar seam was
off by +8px, -8px, +16px, +12px and +4px across the five frog themes and never
flush; the topbar's own search, select and toggle disagreed by up to 20px; the
table toolbar rendered at a fixed 53px at every density; and catalog specimens
stretched to the prose column beside them, leaving up to 249px of dead space.

No authentication, route, secret, policy, or Cloudflare resource configuration
change is intended.

## Scope limit and accepted difference

This vendors the catalog surface only
(`node mcp/vendor-moss.mjs <moss> --only catalog`). The MCP dashboard stays
pinned at `v0.1.0-efc023c` and `src/pages/mcp/index.astro` is not edited, so the
MCP, Bullfrog, Terrarium, Trading Agent and Ledger surfaces keep the exact Moss
runtime they were verified against. The Bullfrog dashboard was rewritten and
deployed earlier today, and the Moss revision published here changes shared
component metrics (chips, view tabs, segmented controls, table headers, panel
headers, and the theme toggle's geometry), so bumping the dashboard pin in the
same operation would change a surface this process cannot authenticate to and
re-verify.

Accepted remaining difference: `/moss` serves Moss `6b225b1` while `/mcp` serves
`efc023c`, so the two Moss surfaces are deliberately not one runtime identity
after this operation. Bumping `mossVersion` is a separate, deliberate operation
that should re-verify the dashboards that load it.

Correction: the source-side record in `BrandoRiv/moss` names the dashboard pin as
`v0.1.0-296f366`. The pin in this repository is `v0.1.0-efc023c`; `296f366` is a
superseded pin directory that is retained for rollback. The substance of that
record is unchanged, since neither operation edits the dashboard pin.

## Execution

Pending.

## Validation and evidence

Pending.

## Rollback

Revert this merge and redeploy; the superseded `public/moss` payload returns with
it. The dashboard pin is untouched, so no adopted surface needs rollback.
