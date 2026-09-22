# Host the private Moss catalog behind dashboard authentication

- Event time (UTC): planned 2026-09-22
- Recorded on (UTC): 2026-09-22
- Record type: contemporaneous
- Actor: Codex acting for Brandon
- Environment and targets: Cloudflare Worker `brandoriv-dev`; `https://brandoriv.dev/moss`
- Status: planned
- Source/action references: branch `moss-catalog-hosting`; Moss source revision `e8e0f10`
- Related records: Moss `changes/2026-09-21-private-repository-and-catalog-deployment.md`

## Reason and change

Expose the Moss component catalog at a stable URL without making it anonymous-public. The route reuses the existing signed MCP dashboard session and Microsoft allowlist; unauthenticated requests redirect to the private MCP sign-in surface.

## Execution

Planned: add the `/moss*` Worker route, package the catalog as static assets, build and deploy through Wrangler, then verify anonymous rejection and authenticated rendering. No authentication secrets or allowlist values change.

## Validation and evidence

Pending. Verify build tests, route security, catalog assets, theme preset switching, density switching, rail behavior, and representative interactive components.

## Rollback

Revert this change and redeploy the prior Worker revision. The private Moss source repository is independent of catalog hosting.

## Drift and follow-up

The catalog is a vendored snapshot of Moss revision `e8e0f10`; future releases require an explicit snapshot update.
