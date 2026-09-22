# Publish the Moss table query components

- Status: prepared; not yet deployed
- Recorded on (UTC): 2026-09-22T18:36Z
- Actor: Claude Opus 5 acting for Brandon
- Targets: authenticated `https://brandoriv.dev/moss`; the MCP dashboard Moss runtime pin
- Moss source: `296f366` (0.4.0), previously `5438f93`

## Intended operation

Moss 0.4.0 adds the parts Ledger's transactions table now uses: `moss-view-tabs`,
`moss-filter-chips`, the table shell toolbar with column sort menus, and
`moss-table--stack` for phone records. The catalog at `https://brandoriv.dev/moss` still
serves `5438f93`, which predates them, so the components are live in Ledger but
undocumented on the catalog.

Vendor `296f366` into both surfaces, move the dashboard pin from `v0.1.0-5438f93` to
`v0.1.0-296f366`, run the full build, deploy the Worker, and verify the authenticated
catalog and the MCP dashboard.

One rule in this revision reaches existing adopters rather than only new markup:
`.moss-table thead th` becomes sticky with an opaque raised background. MCP dashboard
tables inherit that. No other existing selector changed, and no token, theme, or
authentication behavior changed.

Superseded pins stay in place, so rollback is reverting this merge and restoring the
preceding Worker version.

## Outcome

Pending.
