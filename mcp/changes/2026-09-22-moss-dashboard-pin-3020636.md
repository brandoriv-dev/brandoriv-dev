# Move the MCP dashboard's Moss pin to 3020636

- Status: planned
- Recorded on (UTC): 2026-09-22
- Actor: Claude Opus 5 acting for Brandon
- Target: `https://brandoriv.dev/mcp`
- Related: `2026-09-22-moss-catalog-revendor.md`, `2026-09-22-moss-dashboard-migration-plan.md`

## Reason and intended operation

The dashboard loaded Moss `e8e0f10` from `/mcp/moss/v0.1.0-e8e0f10/`, while the
catalog moved to `3020636`. The two surfaces ran different revisions of the same
library, and the dashboard kept the older Moss, including its text-glyph rail
toggle.

Vendor Moss `3020636` to `/mcp/moss/v0.1.0-3020636/`, point `mossVersion` in
`src/pages/mcp/index.astro` at it, and carry the product theme across the theme
engine's contract change. Then run the repository test suite and full build and
deploy the Worker.

Three parts of the theme needed migrating, because the engine changed under them
rather than because the dashboard's design changed:

- Palette keys `accent`, `accentStrong` and `accentSurface` became `primary`,
  `primaryStrong` and `primarySurface`. Left alone they would have been ignored
  and the tree-frog green would have fallen back to the Moss default. The engine
  still emits `--moss-accent*` as aliases, so the dashboard's own CSS is
  unaffected.
- Fixed `radiusSm`, `radiusMd` and `radiusLg` became a derived scale from
  `sharpness`, `radiusMin` and `radiusMax`. Solving the engine's formula for the
  dashboard's existing radii gives `sharpness: 0`, `radiusMin: .09375rem`,
  `radiusMax: .875rem`, which reproduces `.375`, `.625` and `.875rem` exactly.
- `components.bars.radius` became `charts.barRadius`. The old key was inert
  under the new engine, and a test asserting it would have kept passing while
  asserting nothing.

The theme gains a `secondary` colour, which the engine now expects and the
dashboard never declared. Rather than invent one, it takes the teal already in
the theme's `info` and data palette, so no new colour enters the product.

Roll back by setting `mossVersion` back to `v0.1.0-e8e0f10`, whose vendored files
are deliberately left in place, and redeploying; or redeploy the preceding Worker
version.

## Outcome

Pending.
