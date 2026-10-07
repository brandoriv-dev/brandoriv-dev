# Re-vendor both Moss surfaces at the chrome-sizing revision

- Event time (UTC): 2026-09-23T01:35:00Z
- Recorded on (UTC): 2026-09-23T01:35:00Z
- Record type: contemporaneous
- Actor: Claude, working for the repository owner; Cloudflare Workers Builds
- Environment and targets: GitHub `BrandoRiv/brandoriv-dev`; Cloudflare Worker `brandoriv-dev`; authenticated routes `/moss` and `/mcp`
- Status: applied with authenticated dashboard rendering pending
- Source/action references: Moss revision `6b225b13ae73683ace93feab6b7d29127d3f2280` (`BrandoRiv/moss#12`); Moss Azure deploy run `35805948111`
- Related records: [category pages](2026-09-23-moss-category-pages-deployment.md); [Bullfrog UI](2026-09-23-bullfrog-ui-deployment.md); authoritative private-source record is in `BrandoRiv/moss` at `changes/2026-09-23-catalog-sizing-and-toolbar.md`

## Reason and change

Publish the Moss revision that sizes the catalog chrome from the applied theme.
Measured against the previously vendored catalog, the rail-to-topbar seam was
off by +8px, -8px, +16px, +12px and +4px across the five frog themes and never
flush; the topbar's own search, select and toggle disagreed by up to 20px; the
table toolbar rendered at a fixed 53px at every density; and catalog specimens
stretched to the prose column beside them, leaving up to 249px of dead space.

Both vendored surfaces move together, as `mcp/dashboard-test.mjs` requires. The
dashboard pin advances from `v0.1.0-efc023c` to `v0.1.0-6b225b1`, and
`src/pages/mcp/index.astro` plus the four pinned paths and the expected revision
in `mcp/dashboard-test.mjs` are updated to match. Superseded pin directories stay
in place so a rollback is a one-line revert.

No authentication, route, secret, policy, or Cloudflare resource configuration
change is intended.

## Risk accepted

The Moss revision changes shared component metrics: view tabs, filter chips,
segmented controls and table headers move onto a derived `--moss-control-compact`
band; table and panel bars derive height and inset from the density tokens; and
the theme toggle's track, thumb and travel are computed from that band rather
than fixed at `3rem` by `1.75rem`.

The Bullfrog dashboard at `/mcp` was rewritten and deployed earlier today
(`48cc636`, deployment recorded in `2026-09-23-bullfrog-ui-deployment.md`), so
this operation puts a changed Moss runtime under a recently changed surface. The
owner asked for the full deployment rather than leaving the two surfaces split.

## Execution

PR #75 merged to `main` as `2884f53` at 2026-09-23T01:34:58Z. Cloudflare Workers
Builds published Worker version `ed3bf3ff-c423-4b7d-8402-554cb904cf31` at
2026-09-23T01:35:44Z, 46 seconds after the merge, and it serves 100 percent of
traffic. The preceding version was `29116cbf-ecc7-40a4-8598-eeb4e5f6e773`.

The Moss source revision reached its own private Azure catalog first: `BrandoRiv/moss`
CI run `35805948111` completed with `verify` and `deploy` both successful.

## Pre-existing failure on main, not introduced here

`main` was already failing `mcp/smoke.mjs` before this operation. The Bullfrog
rewrite (`48cc636`) removed the string `Private MCP console`, which the assertion
`browser document returns the dashboard shell` still requires, and the four most
recent `main` runs before this merge failed the same way. `origin/main` does not
contain that string either, and this branch does not touch `mcp/smoke.mjs`. The
failure is left for the author of that rewrite rather than patched here, since
choosing the replacement marker is a decision about that surface.

The PR's own `Policy and dashboard checks` and `Workers Builds: brandoriv-dev`
checks passed.

## Validation and evidence

Local `bun run build` passed in full: 36 Microsoft auth checks, 10 answer-study
checks, 61 MCP dashboard checks, the policy store and 41 routing checks, the
workerd harness suite, policy evaluation, `astro check` and `astro build`.

The built `/mcp` page was served from `dist` and rendered at 1440x900, 1024x768
and 390x844. The page reports Moss `v0.1.0-6b225b1`, registers `moss-rail`,
draws all 20 `moss-icon` elements with no empty icon, raises no JavaScript error
and produces no horizontal overflow at any of the three widths. The Moss theme
toggle, one of the components whose geometry changed, renders correctly on that
surface. Only the sign-in screen is reachable this way; the authenticated
dashboard body requires a production session this process does not hold, and its
`/mcp/dashboard/data` request returns 404 against a static `dist` server as
expected.

After deployment, anonymous requests to `https://brandoriv.dev/moss` and
`https://brandoriv.dev/moss/catalog.css` returned `302 /mcp?next=%2Fmoss` with
`Cache-Control: no-store`, so neither the catalog nor its assets became
anonymously readable. `https://brandoriv.dev/mcp/health` returned `ok` at version
`1.11.1` with all four protocols, and the public site returned 200.

Remaining: authenticated rendering of the signed-in Bullfrog dashboard.

## Rollback

Revert this merge and redeploy. `v0.1.0-efc023c` remains on disk, so restoring
the previous dashboard runtime is a revert of `mossVersion` and the four pinned
paths in `mcp/dashboard-test.mjs`.
