# Publish Moss review fixes and theme toggle

- Status: published and verified
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: `/moss` and `/mcp`

Fixed the private catalog sign-in return path, published the Moss theme-toggle primitive, replaced MCP's theme dropdown, and included the mobile hierarchy improvements in PR #55, merge `28aaed2`. The full build passed and Cloudflare Worker version `1c19dfbd-e50f-48d4-8a4a-849a571e3f7b` was deployed on 2026-09-22 UTC. Anonymous `/moss` now returns `/mcp?next=%2Fmoss` with no-store caching so successful authentication returns to the catalog. Roll back by reverting the merge and redeploying the preceding Worker version.
