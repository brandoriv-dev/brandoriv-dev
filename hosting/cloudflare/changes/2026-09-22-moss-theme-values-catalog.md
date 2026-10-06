# Deploy the MossTheme values catalog

- Status: completed and verified
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: authenticated catalog at `https://brandoriv.dev/moss`
- Moss source: `cd46ee7`

## Intended operation

Vendor the MossTheme documentation section, including applied values, five-theme comparison, and complete expandable value objects. Keep the repository invariant by pinning the MCP dashboard runtime to the same Moss revision. Run the full build, deploy the Worker, and verify anonymous routing and authenticated rendered content. Roll back by reverting this deployment and restoring the preceding Worker version.

## Outcome

- Completed on (UTC): 2026-09-22 13:35
- Brandoriv revision: `aee513c` (merge of PR #65)
- Moss revision: `cd46ee7`
- Cloudflare Worker version: `dd1c7edd-4b1d-495e-8a3d-e785f974e7d1`
- Verification: Moss tests and local Chromium rendering passed. The full Brandoriv build passed, including 58 dashboard checks and 383/383 policy-pattern checks. Production returned `200` for the authenticated page and catalog script; the page contains the MossTheme section, comparison and value containers; the script contains comparison rows and complete JSON rendering; and the vendor record reports `cd46ee7`. Anonymous access still returns one `302` to `/mcp?next=%2Fmoss` with `Cache-Control: no-store`.
- Rollback: revert PR #65 and redeploy Worker version `a2fb9a78-d23c-40f4-86fa-d6b6e74d2aa5`.
- Remaining difference: none.
