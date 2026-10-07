# Move the MCP dashboard's Moss pin to 3020636

- Status: applied with authenticated review pending
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

- Completed on (UTC): 2026-09-22 12:41
- Source revision: `59b1a6b` (merge of PR #61)
- Moss revision vendored: `3020636`, recorded in
  `public/mcp/moss/v0.1.0-3020636/vendor.json`
- Cloudflare Worker version: `16bdc035-bbba-45d0-af86-ba975428b08f`
- Actual change: vendored the six-file Moss runtime to
  `public/mcp/moss/v0.1.0-3020636/`, moved `mossVersion` to that path, migrated
  the product theme's palette keys, geometry and bar radius to the new engine
  contract, added a secondary colour from the theme's existing teal, and
  replaced the rail toggle glyph with a Moss icon. The superseded
  `v0.1.0-e8e0f10` directory was deliberately left in place.
- Deployment tool: wrangler 4.126.0, the version this repository pins.
- Verification: `bun run build` passed before deploy from the merged revision —
  Microsoft auth 36 checks, answer-study 10, MCP dashboard 58, policy store 7,
  routing 41, harness and Ledger proxy 14 cases, `astro check` 0 errors. The
  built page was rendered in Chromium beforehand: theme name `Tree Frog MCP`,
  `--moss-accent` `#338a35`, `--moss-radius-md` `0.625rem`,
  `--moss-chart-bar-radius` `0`, rail widths unchanged, the toggle icon drawn
  and swapping between `expand-rail` and `collapse-rail` on click, and no
  console errors. After deploy, the production page returns `200 text/html` and
  its source carries `v0.1.0-3020636`, the `moss-icon` rail toggle, and no arrow
  glyph; `/mcp/moss/v0.1.0-3020636/icons.js` returns `200`; and `/moss` still
  returns one `302` to the dashboard for anonymous requests.
- Not verified: the signed-in dashboard. This process held no production session
  credential, so the authenticated surface was checked through page source and
  the local DOM rather than visually. Brandon should confirm the overview,
  policies and connect views in light and dark before this record is treated as
  fully verified.
- Rollback: set `mossVersion` back to `v0.1.0-e8e0f10`, whose files remain in the
  repository, and redeploy; or redeploy preceding Worker version
  `9890af30-5e97-4b55-bc3a-e963e307f043`.

## Drift and follow-up

Both vendored surfaces now run Moss `3020636`, and a dashboard check asserts they
stay equal. The dashboard's own icons remain the product's build-time Lucide set
in `src/components/Icon.astro`; only the rail toggle uses Moss's icon contract,
because the rail component manages that icon's state. Unifying the two icon
systems was not attempted here.
