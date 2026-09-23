# Publish the paged Moss component catalog

- Event time (UTC): 2026-09-23T00:17:47Z
- Recorded on (UTC): 2026-09-23T00:17:47Z
- Record type: contemporaneous
- Actor: Codex, working for the repository owner; Cloudflare Workers Builds
- Environment and targets: GitHub `BrandoRiv/brandoriv-dev`; Cloudflare Worker `brandoriv-dev`; authenticated routes `/moss` and `/mcp`
- Status: planned
- Source/action references: PR `BrandoRiv/brandoriv-dev#73`; source revision `d7b5ac535d2dd1eff6e76cb10aaf294908310696`; Moss revision `efc023c6ac84a78f065fc82d1135e6a652ca661c`
- Related records: [catalog hosting](2026-09-22-moss-catalog-hosting.md); [table query components](2026-09-22-moss-table-query-parts.md); authoritative private-source deployment is recorded in `BrandoRiv/moss`

## Reason and change

Publish the fixed-rail, category-based Moss catalog at the authenticated `/moss`
route after the same Moss revision reaches its private Azure source catalog. The
website vendor also pins `/mcp` to that revision so both served Moss surfaces retain
one runtime identity. The release includes the prepared table-query components and
bounded rail behavior already present on the branch. No authentication, route,
secret, policy, or Cloudflare resource configuration change is intended.

## Execution

After `BrandoRiv/moss#8` deploys successfully, merge PR #73. Cloudflare Workers
Builds will publish `main` to the existing `brandoriv-dev` Worker. Capture the new
Worker version, then verify anonymous authentication routing and the catalog assets.
The pre-deployment Worker version is
`fff70448-d198-4492-a013-d3da4a9316b9`.

## Validation and evidence

The full local build passed, including 61 MCP dashboard checks, 41 routing checks,
the worker smoke suite, and Astro validation/build. The exact vendored `/moss`
payload rendered at 1440x1000, 768x900, and 390x844 without horizontal overflow or
failed asset requests. Rail bounds stayed fixed through desktop and tablet page
scrolling. PR policy, dashboard, smoke, and Cloudflare build checks passed.
Production publication and live route validation remain pending.

## Rollback

Roll Cloudflare back to Worker version
`fff70448-d198-4492-a013-d3da4a9316b9`, or revert the merge and republish. Restore
the preceding MCP Moss pin `v0.1.0-57175a1` if the new vendor revision must be
withdrawn. Rollback has not been performed.

## Drift and follow-up

Record the merge revision, Worker version, anonymous redirect behavior, asset checks,
and authenticated catalog result after deployment. Interactive owner rendering may
remain a manual check if no reusable signed browser session is available.
