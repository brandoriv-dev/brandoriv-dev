# Publish MCP policy provenance and capability inventory

- Status: planned
- Verified: not checked
- Checked: implementation will be tested locally before publication
- Not checked: pull-request checks, merge, Cloudflare publication, and live dashboard metadata
- When (UTC): 2026-09-23T23:54:00Z (planned)
- Actor: Cursor agent for Brandon Rivera
- Target: GitHub `BrandoRiv/brandoriv-dev` `main`; Cloudflare Worker `brandoriv-dev`; authenticated `/mcp` dashboard
- Previous: live MCP service version `1.13.0`
- Deployed: none
- Source: branch `feat/mcp-policy-provenance`

## Intent

Record when each policy was last reviewed and which optional skills and tools are
related to it. Show this operational inventory in the authenticated policy detail
without adding it to normal `get_guidance` responses.

The publication also updates the service to `1.14.0`. Existing KV policy versions
remain authoritative for content and version history; compiled catalog metadata
supplies the current capability inventory and fills metadata missing from older
stored records.

## Outcome

Not attempted. Update this record after publication with the merge revision,
Cloudflare build or Worker version, live health response, and dashboard verification.

## Rollback

Revert the merge and let Workers Builds republish the preceding revision. Existing
KV policy content does not need migration or rollback.
