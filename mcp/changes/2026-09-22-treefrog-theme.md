# Green tree frog MCP theme

- Status: published and automatically verified
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: `https://brandoriv.dev/mcp`
- Source: PR #53; merge `df4eae7ab210f9fae5876e738d6fdc623cfbe7a7`; Moss runtime `e8e0f10`; Cloudflare Worker version `f3b852f8-4092-4d2a-8719-5f81964d5ffd`

## Intent

Give MCP a more playful and engaging green-tree-frog identity using fresh leaf greens, deep pond surfaces, buoyant geometry, and bright but semantic chart accents. Dense operational information and square analytical bars remain precise. Authentication, policies, APIs, routes, and IDs remain unchanged.

## Validation, rollback, and drift

MCP TypeScript, 36 authentication checks, 46 dashboard checks, the full answer-study/policy/proxy suite, and Astro check/build passed. Deployed through Wrangler on 2026-09-22 UTC as Worker version `f3b852f8-4092-4d2a-8719-5f81964d5ffd`; production returned the expected anonymous 401 with `Cache-Control: no-store`. Roll back by reverting this theme commit and redeploying the previous Worker revision. Authenticated owner visual inspection remains a follow-up.
