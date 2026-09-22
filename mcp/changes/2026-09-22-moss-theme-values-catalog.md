# Deploy the MossTheme values catalog

- Status: prepared; not yet deployed
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: authenticated catalog at `https://brandoriv.dev/moss`
- Moss source: `cd46ee7`

## Intended operation

Vendor the MossTheme documentation section, including applied values, five-theme comparison, and complete expandable value objects. Keep the repository invariant by pinning the MCP dashboard runtime to the same Moss revision. Run the full build, deploy the Worker, and verify anonymous routing and authenticated rendered content. Roll back by reverting this deployment and restoring the preceding Worker version.
