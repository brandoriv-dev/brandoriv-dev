# Deploy theme-owned catalog density

- Status: prepared; not yet deployed
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: authenticated `https://brandoriv.dev/moss`
- Moss source: `5438f93`

## Intended operation

Remove the independent density selector from the catalog so each frog theme applies its authored default density. Vendor the matching Moss runtime for MCP, run the full build, deploy, and verify that production contains one frog selector and no density override. Roll back by reverting this operation and restoring the preceding Worker version.
