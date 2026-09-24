# Converge the MCP dashboard on Moss primitives

- Status: applied
- Verified: partly
- Checked: Moss source checkout was clean at `cb75ab0ee010fa888a0882c258980120f898cc33`; both catalog and dashboard assets were vendored from that committed revision. TypeScript, 36 auth checks, 10 answer-study checks, 63 dashboard checks, 16 policy-store checks, 44 routing checks, 14 Harness proxy cases, the 26-case policy evaluation, and operation-record lint passed locally.
- Not checked: the full Astro build and browser preview remain blocked by an incomplete generated dependency tree (`hast-util-to-html` and esbuild installer files are absent even after a frozen-lockfile reinstall); authenticated production rendering and deployment remain pending CI.
- When (UTC): 2026-09-24T02:18:00Z
- Actor: Codex for Brandon Rivera
- Target: GitHub `BrandoRiv/brandoriv-dev`; static MCP dashboard at `/mcp` and private Moss catalog at `/moss`
- Previous: Moss dashboard pin `v0.1.0-6b225b1`
- Deployed: not deployed; local implementation only
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
contracts passed; the full build stopped only when Astro loaded the incomplete
local dependency tree described above. No external system was changed and no
deployment is claimed.

## Rollback

Revert this branch's source and vendor changes. The prior `v0.1.0-6b225b1`
directory remains available for a one-line pin restoration; no live rollback was
performed.
