# Host the private Moss catalog behind dashboard authentication

- Event time (UTC): 2026-09-22T02:05:00Z
- Recorded on (UTC): 2026-09-22
- Record type: contemporaneous
- Actor: Codex acting for Brandon
- Environment and targets: Cloudflare Worker `brandoriv-dev`; `https://brandoriv.dev/moss`
- Status: applied and verified
- Source/action references: brandoriv-dev merge `6accfe8d962201bfb9ac880c2d55977ad2d8283f`; PR #51; Moss source revision `e8e0f10`; Cloudflare Worker version `4a3845bf-4926-4305-80ec-f31121546d11`
- Related records: Moss `changes/2026-09-21-private-repository-and-catalog-deployment.md`

## Reason and change

Expose the Moss component catalog at a stable URL without making it anonymous-public. The route reuses the existing signed MCP dashboard session and Microsoft allowlist; unauthenticated requests redirect to the private MCP sign-in surface.

## Execution

Added the `/moss*` Worker route, packaged the catalog as static assets, and deployed it with Wrangler. The route uses the existing signed MCP dashboard session. No authentication secrets or allowlist values changed.

## Validation and evidence

TypeScript, 36 authentication checks, 46 dashboard/catalog checks, answer-study tests, policy-store tests, 41 routing tests, 14 proxy tests, 383 policy checks, Astro check, and Astro build passed. An anonymous production request to `https://brandoriv.dev/moss` returned `302 Location: /mcp` with `Cache-Control: no-store`, confirming the catalog is not anonymously readable. The deployed worker reports version `4a3845bf-4926-4305-80ec-f31121546d11`. Authenticated production rendering could not be automated because no production bearer token was exposed to this process; the route and asset behavior are covered by source tests and the shared session implementation.

## Rollback

Revert this change and redeploy the prior Worker revision. The private Moss source repository is independent of catalog hosting.

## Drift and follow-up

The catalog is a vendored snapshot of Moss revision `e8e0f10`; future releases require an explicit snapshot update. Authenticated visual inspection remains a follow-up.
