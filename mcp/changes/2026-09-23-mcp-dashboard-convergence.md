# Converge the MCP dashboard on Moss primitives

- Status: planned
- Verified: not checked
- Checked: Moss source checkout was clean at `8a99c1aa1fad4fe8c8868cdf37ed478a4a684712`; both catalog and dashboard assets were vendored from that committed revision; dashboard contract tests passed locally.
- Not checked: full dependency-backed build and browser preview remain pending in this worktree; authenticated production rendering and deployment are intentionally not performed by this change.
- When (UTC): 2026-09-23T00:00:00Z
- Actor: Codex for Brandon Rivera
- Target: GitHub `BrandoRiv/brandoriv-dev`; static MCP dashboard at `/mcp` and private Moss catalog at `/moss`
- Previous: Moss dashboard pin `v0.1.0-6b225b1`
- Deployed: not deployed; local implementation only
- Source: Moss `main` revision `8a99c1aa1fad4fe8c8868cdf37ed478a4a684712`

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

The branch now vendors Moss `8a99c1a` into both served surfaces and pins the MCP
page and dashboard assertions to `v0.1.0-8a99c1a`. Dashboard markup and styles
adopt the contracts listed above while preserving the collapsed rail and existing
responsive composition. No external system was changed and no deployment is
claimed.

## Rollback

Revert this branch's source and vendor changes. The prior `v0.1.0-6b225b1`
directory remains available for a one-line pin restoration; no live rollback was
performed.
