# Green tree frog MCP theme

- Status: prepared; not yet published
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: `https://brandoriv.dev/mcp`
- Source: branch `mcp-treefrog-theme`; Moss runtime `e8e0f10`

## Intent

Give MCP a more playful and engaging green-tree-frog identity using fresh leaf greens, deep pond surfaces, buoyant geometry, and bright but semantic chart accents. Dense operational information and square analytical bars remain precise. Authentication, policies, APIs, routes, and IDs remain unchanged.

## Validation, rollback, and drift

Run MCP checks and the full Astro build before merge, then deploy through the existing Cloudflare Worker path. Roll back by reverting this theme commit and redeploying the previous Worker revision. Authenticated visual inspection remains required after publication.
