# Deploy theme-owned catalog density

- Status: completed and verified
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: authenticated `https://brandoriv.dev/moss`
- Moss source: `5438f93`

## Intended operation

Remove the independent density selector from the catalog so each frog theme applies its authored default density. Vendor the matching Moss runtime for MCP, run the full build, deploy, and verify that production contains one frog selector and no density override. Roll back by reverting this operation and restoring the preceding Worker version.

## Outcome

- Completed on (UTC): 2026-09-22T17:50:00Z
- Moss source revision: `5438f93`
- Site merge revision: `c629b2d` (PR #69)
- Cloudflare Worker version: `73402a3a-5f52-4399-8944-8a598bfa46a1`
- Verification: the full `bun run build` passed; an authenticated production request returned HTTP 200, catalog revision `5438f93`, one frog-theme selector, no density selector or density listener, and theme-owned density behavior.
- Rollback: restore Worker version `dd1c7edd-4b1d-495e-8a3d-e785f974e7d1` or revert site merge `c629b2d` and redeploy.
- Remaining difference: none for this operation.
