# Publish the paged Moss component catalog

- Event time (UTC): 2026-09-23T00:17:47Z
- Recorded on (UTC): 2026-09-23T00:17:47Z
- Record type: contemporaneous
- Actor: Codex, working for the repository owner; Cloudflare Workers Builds
- Environment and targets: GitHub `BrandoRiv/brandoriv-dev`; Cloudflare Worker `brandoriv-dev`; authenticated routes `/moss` and `/mcp`
- Status: applied with authenticated rendering pending
- Source/action references: PR `BrandoRiv/brandoriv-dev#73`; merge `5ea24d6450b7bf648860c304b9a573f7690b11ac`; CI run `35801826171`; Cloudflare build `297c5dd4-3ccd-4317-ada0-a4a6a0bd579a`; Worker version `34ce9d44-3f34-4ff6-aff7-576fd3ba5e40`; Moss revision `efc023c6ac84a78f065fc82d1135e6a652ca661c`
- Related records: [catalog hosting](2026-09-22-moss-catalog-hosting.md); [table query components](2026-09-22-moss-table-query-parts.md); authoritative private-source deployment is recorded in `BrandoRiv/moss`

## Reason and change

Publish the fixed-rail, category-based Moss catalog at the authenticated `/moss`
route after the same Moss revision reaches its private Azure source catalog. The
website vendor also pins `/mcp` to that revision so both served Moss surfaces retain
one runtime identity. The release includes the prepared table-query components and
bounded rail behavior already present on the branch. No authentication, route,
secret, policy, or Cloudflare resource configuration change is intended.

## Execution

After `BrandoRiv/moss#8` deployed successfully, PR #73 merged to `main` at
2026-09-23T00:23:08Z. Cloudflare Workers build
`297c5dd4-3ccd-4317-ada0-a4a6a0bd579a` published merge `5ea24d6` to the existing
`brandoriv-dev` Worker. Deployment `16c1a40b-674b-4756-92e1-91e1377a626f`
routed 100 percent of traffic to Worker version
`34ce9d44-3f34-4ff6-aff7-576fd3ba5e40` at 2026-09-23T00:23:44Z. The preceding
version was `fff70448-d198-4492-a013-d3da4a9316b9`.

## Validation and evidence

The full local build passed, including 61 MCP dashboard checks, 41 routing checks,
the worker smoke suite, and Astro validation/build. The exact vendored `/moss`
payload rendered at 1440x1000, 768x900, and 390x844 without horizontal overflow or
failed asset requests. Rail bounds stayed fixed through desktop and tablet page
scrolling. PR policy, dashboard, smoke, and Cloudflare build checks passed.
GitHub CI run `35801826171` repeated the policy, dashboard, build, and worker smoke
checks successfully, and the Cloudflare production build check passed. Fresh
anonymous requests to `/moss`, `/moss/`, `/moss/catalog.css`, and
`/moss/vendor.json` each returned one `302` to `/mcp?next=%2Fmoss` with
`Cache-Control: no-store`. The deployed MCP vendor manifest returned `200` and
reported the expected full Moss revision `efc023c6ac84a78f065fc82d1135e6a652ca661c`.
An owner-authenticated production catalog render was not automated.

## Rollback

Roll Cloudflare back to Worker version
`fff70448-d198-4492-a013-d3da4a9316b9`, or revert the merge and republish. Restore
the preceding MCP Moss pin `v0.1.0-57175a1` if the new vendor revision must be
withdrawn. Rollback has not been performed.

## Drift and follow-up

Interactive owner rendering remains a manual check because no reusable signed browser
session was available. The pre-existing manual `answer-study.yml` workflow continues
to emit a jobless startup failure on repository pushes (this deployment's occurrence
is run `35801825307`); the required CI and Cloudflare publication checks passed and
that workflow did not run a paid study. Repair it as a separate workflow-maintenance
change.
