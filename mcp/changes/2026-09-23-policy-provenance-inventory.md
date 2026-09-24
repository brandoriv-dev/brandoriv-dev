# Publish MCP policy provenance and capability inventory

- Status: applied
- Verified: partly
- Checked: PR checks and smoke build passed; merge revision confirmed; live health returned service version `1.14.0`
- Not checked: authenticated production dashboard rendering; Brandon can verify the policy age and capability rows after signing in
- When (UTC): 2026-09-24T00:19:36Z
- Actor: Cursor agent for Brandon Rivera
- Target: GitHub `BrandoRiv/brandoriv-dev` `main`; Cloudflare Worker `brandoriv-dev`; authenticated `/mcp` dashboard
- Previous: live MCP service version `1.13.0`
- Deployed: merge commit `e7d490d3c38641d12db604bb42aacbfa1eacd390`; live service version `1.14.0`
- Source: PR `https://github.com/BrandoRiv/brandoriv-dev/pull/82`

## Intent

Record when each policy was last reviewed and which optional skills and tools are
related to it. Show this operational inventory in the authenticated policy detail
without adding it to normal `get_guidance` responses.

The publication also updates the service to `1.14.0`. Existing KV policy versions
remain authoritative for content and version history; compiled catalog metadata
supplies the current capability inventory and fills metadata missing from older
stored records.

## Outcome

PR 82 merged into `main` at 2026-09-24T00:19:36Z as
`e7d490d3c38641d12db604bb42aacbfa1eacd390`.

- Policy, dashboard, full build, and MCP smoke checks passed in GitHub Actions run
  `35937830542`.
- Cloudflare Workers Builds reported success for PR build
  `d82ac818-f51c-4f5c-9adb-55a60cc52ba3`.
- `https://brandoriv.dev/mcp/health` returned `ok: true` and version `1.14.0`
  after the merge.

The available GitHub status did not expose the production build identifier.
Authenticated dashboard rendering was not checked because it requires Brandon's
session; the live version confirms the updated Worker was published.

## Rollback

Revert the merge and let Workers Builds republish the preceding revision. Existing
KV policy content does not need migration or rollback.
