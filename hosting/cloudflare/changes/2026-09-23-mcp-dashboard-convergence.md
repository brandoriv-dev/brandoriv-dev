# Converge the MCP dashboard on Moss primitives

- Status: applied
- Verified: partly
- Checked: Moss source checkout was clean at `cb75ab0ee010fa888a0882c258980120f898cc33`; both catalog and dashboard assets were vendored from that committed revision. TypeScript, 36 auth checks, 10 answer-study checks, 63 dashboard checks, 16 policy-store checks, 44 routing checks, 14 Harness proxy cases, the 26-case policy evaluation, and operation-record lint passed locally. Clean CI then passed the full Astro build, worker smoke test, policy/dashboard checks, and Cloudflare Workers production build.
- Not checked: authenticated production dashboard content was not rendered because this session had no owner token; the live `/mcp` route did return its expected `401` authentication boundary and `/moss` redirected to that sign-in route.
- When (UTC): 2026-09-24T02:23:18Z
- Actor: Codex for Brandon Rivera
- Target: GitHub `BrandoRiv/brandoriv-dev`; static MCP dashboard at `/mcp` and private Moss catalog at `/moss`
- Previous: Moss dashboard pin `v0.1.0-6b225b1`
- Deployed: merge `bd42a2b5fdeb4367b95f89ed1f86e211b9e25a4c`; CI run `35946741576`; successful Cloudflare Workers build `a8e6f0ab-6fbc-4e3f-b37b-79b69e3b285d`
- Source: Moss revision `cb75ab0ee010fa888a0882c258980120f898cc33`

## Intent

Refresh the dashboard's obsolete Moss pin and remove duplicated local contracts
where the current Moss API has an exact semantic match. Generic panels use Moss
panel headers and bodies; quality and transport rows use Moss details; evidence
uses a reading strip; client selection uses the segmented control; and buttons,
fields, code, signals, shell chrome, and the existing narrative continue through
Moss primitives. The policy browser, benchmark composition and chart, auth art,
notifications, and MCP-specific behavior remain product-owned.

The branch is isolated from unrelated local commits on the main checkout. No
Moss source is vendored while dirty, and no uncommitted Moss changes are included.

## Outcome

The branch now vendors Moss `cb75ab0` into both served surfaces and pins the MCP
page, theme import, and dashboard assertions to `v0.1.0-cb75ab0`. Dashboard markup and styles
adopt the contracts listed above while preserving the collapsed rail and existing
responsive composition. The vendor helper now updates every pin consumer so a
future refresh cannot silently leave tests on an older runtime. The application
contracts passed. Although one local generated dependency tree was incomplete,
clean CI installed from the lockfile, built Astro, started the worker, and passed
its smoke test. PR #83 merged and the Cloudflare production build passed. A
separate `answer-study.yml` push workflow failed before creating any job or log;
this change did not modify that workflow, while its answer-study test passed inside
the required CI workflow.

## Rollback

Revert merge `bd42a2b` and let Cloudflare rebuild the preceding `62b67eb` revision.
The prior `v0.1.0-6b225b1` directory remains available for a one-line pin restoration;
no live rollback was performed.
