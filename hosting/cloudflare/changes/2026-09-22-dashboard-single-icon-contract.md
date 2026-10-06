# Draw every MCP dashboard icon through the Moss contract

- Status: applied with authenticated review pending
- Recorded on (UTC): 2026-09-22
- Actor: Claude Opus 5 acting for Brandon
- Target: `https://brandoriv.dev/mcp`
- Related: `2026-09-22-moss-dashboard-pin-3020636.md`, moss PR #3

## Reason and intended operation

The dashboard drew icons three ways: a product Lucide set in
`src/components/Icon.astro`, inline SVG built by hand inside
`public/mcp/dashboard.js`, and one Moss icon on the rail toggle. Three sources
for one visual language meant a change of icon family touched three places and
could not be checked.

Moss's contract did not yet cover what an application surface needs, so moss
PR #3 added twelve role names — `copy`, `refresh`, `forward`, `external`,
`sign-out`, `document`, `message`, `notification`, `credential`, `secure`,
`service`, `connect` — bringing the contract to 34.

Vendor Moss `90f38ac` to both surfaces, move the dashboard's nineteen `<Icon>`
uses and its three runtime SVGs onto `<moss-icon>`, then run the repository test
suite and full build and deploy the Worker.

`src/components/Icon.astro` stays. The public site's `Contact.astro` and
`TearLine.astro` still use it, and those pages are better served by build-time
icons that need no JavaScript. Only the dashboard moves.

Icon names map to roles, not drawings, and the drawings were kept where a
sensible name existed for them: the Overview destination keeps its pulse mark
under the name `activity` rather than becoming a house under `overview`.

Sizing is unchanged because the elements keep their `icon` and `small-icon`
classes, which set 18 and 16 pixels and outrank the Moss element rule.

Roll back by reverting the merge and redeploying the preceding Worker version.

## Outcome

- Completed on (UTC): 2026-09-22 17:35
- Source revision: `ba0714f` (merge of PR #67)
- Moss revision vendored: `90f38ac` (moss PR #3) on both surfaces
- Cloudflare Worker version: `25903a31-d0fa-49c7-84b0-f332b629e156`
- Actual change: moved nineteen `<Icon>` uses in `src/pages/mcp/index.astro` and
  three runtime SVGs in `public/mcp/dashboard.js` onto `<moss-icon>`, vendored
  Moss `90f38ac` to `public/mcp/moss/v0.1.0-90f38ac/` and `public/moss`, and
  moved `mossVersion` to the new path. `src/components/Icon.astro` was left in
  place for the public site.
- Deployment tool: wrangler 4.126.0, the version this repository pins.
- Verification: `bun run build` passed from the merged revision — Microsoft auth
  36 checks, answer-study 10, MCP dashboard 61, policy store 7, routing 41,
  harness and Ledger proxy 14 cases, `astro check` 0 errors. The built page was
  rendered in Chromium beforehand: all twenty `moss-icon` elements drew an SVG,
  none empty, fifteen distinct names, no `svg.icon` left from the previous
  system, boxes measuring 18 and 16 pixels as before, console clean. After
  deploy, the production page returns `200` and its source carries
  `v0.1.0-90f38ac`, twenty `moss-icon` elements, no `<Icon` use and no inline
  `svg class="icon"`; `/mcp/moss/v0.1.0-90f38ac/icons.js` returns `200`; `/moss`
  still returns one `302` to the dashboard for anonymous requests.
- Not verified: the signed-in dashboard. This process held no production session
  credential, so the authenticated surface was checked through page source and
  the local DOM rather than visually. The notice symbols and the go-button arrow
  in `dashboard.js` only render once dashboard data loads, so they were not seen
  drawn at all and need a signed-in look.
- Rollback: revert the merge of PR #67 and redeploy, or redeploy preceding
  Worker version `16bdc035-bbba-45d0-af86-ba975428b08f`. The superseded pin
  directories remain in the repository.

## Drift and follow-up

The dashboard now has one icon source. The public site keeps
`src/components/Icon.astro`, deliberately, so that marketing pages draw icons
without JavaScript; a dashboard check asserts the dashboard itself no longer
uses it. Because dashboard icons are now custom elements, none of them render if
scripts fail, which is consistent with the rest of that page but is a change
from build-time SVG.
