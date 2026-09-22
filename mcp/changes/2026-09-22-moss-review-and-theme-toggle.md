# Publish Moss review fixes and theme toggle

- Status: prepared; not yet published
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: `/moss` and `/mcp`

Fix the private catalog sign-in return path, publish the Moss theme-toggle primitive, replace MCP's theme dropdown, and include the committed mobile hierarchy improvements. Validate the full build before Cloudflare deployment. Roll back by reverting the merge and redeploying the preceding Worker version.
