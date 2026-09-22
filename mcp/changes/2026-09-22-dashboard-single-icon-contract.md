# Draw every MCP dashboard icon through the Moss contract

- Status: planned
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

Pending.
