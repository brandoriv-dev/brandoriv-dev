# Re-vendor the authenticated Moss catalog at Moss 3020636

- Status: applied with authenticated rendering pending
- Recorded on (UTC): 2026-09-22
- Actor: Claude Opus 5 acting for Brandon
- Target: `https://brandoriv.dev/moss`
- Related: `2026-09-22-moss-catalog-hosting.md`, `2026-09-22-moss-directory-redirect-correction.md`

## Reason and intended operation

The deployed catalog pins Moss `e8e0f10` and has drifted from the library. Since
that pin, Moss gained an applicability block on every component section (moss
PR #1) and replaced its text-glyph icons with a swappable icon pack (moss PR #2),
and the theme engine became a neutral configurable contract.

The deployed page also shows mojibake. The cause is in this repository, not in
Moss: `public/moss/index.html` and `public/moss/catalog.js` were committed with a
byte order mark and double-encoded UTF-8, so the catalog's title reads
`Moss â€" Component catalog` in the browser. The earlier vendoring wrote those
files through a layer that re-encoded the bytes.

Re-vendor `public/moss` from Moss `3020636` using a script that copies bytes
without an encoding round-trip and asserts the result, add the two new runtime
files the icon layer needs (`icons.js` and `icon-packs/iconoir.js`) plus the
catalog's `themes.js`, then run the repository test suite and full build and
deploy the Worker. Verify that `/moss` still refuses anonymous requests, that an
authenticated request renders, and that the served bytes are free of a byte order
mark and of mojibake.

The vendored `index.html` continues to omit the Google Fonts links the source
catalog carries, matching the previous deployment, so the page makes no
third-party request. Roll back by redeploying the preceding Worker version; the
prior vendored files are recoverable from this repository's history.

## Outcome

- Completed on (UTC): 2026-09-22 12:29
- Source revision: `26e30b4` (merge of PR #59)
- Moss revision vendored: `3020636` (moss PR #2), recorded in `public/moss/vendor.json`
- Cloudflare Worker version: `9890af30-5e97-4b55-bc3a-e963e307f043`
- Actual change: re-vendored ten files from Moss `3020636` through
  `mcp/vendor-moss.mjs`, adding `icons.js`, `icon-packs/iconoir.js`, `themes.js`
  and `vendor.json` to `public/moss`, and deployed the Worker. The byte order
  mark and double encoding in `index.html` and `catalog.js` are gone; both files
  are now UTF-8 without a mark, and `index.html` is ASCII.
- Deployment tool: wrangler 4.126.0, the version this repository pins. An
  unpinned install resolved 4.136.2, which was not used.
- Verification: `bun run build` passed before deploy — Microsoft auth 36 checks,
  answer-study 10, MCP dashboard 53, policy store 7, routing 41, harness and
  Ledger proxy 14 cases, `astro check` 0 errors, static build complete. After
  deploy, production anonymous requests to `/moss`, `/moss/` and the new
  `/moss/icons.js` each returned one `302` to `/mcp?next=%2Fmoss` with
  `Cache-Control: no-store`, so the catalog and its new assets are not
  anonymously readable. Before deploy, the vendored files were served locally and
  rendered in Chromium at 1440 and 420 pixels: correct title, all nineteen icons
  drawn, no mojibake, clean console.
- Not verified: authenticated rendering in production. This process held no
  production session credential, so the signed-in page was not fetched. Brandon
  should open `https://brandoriv.dev/moss` and confirm the icons and section
  guidance render before this record is treated as fully verified.
- Rollback: redeploy preceding Worker version
  `bed2efd1-bc23-436b-93ff-9d474acffc71`. The previously vendored files remain
  recoverable from this repository's history at `9d6dc98`.

## Drift and follow-up

The MCP dashboard vendors Moss separately at
`public/mcp/moss/v0.1.0-e8e0f10/` and `src/pages/mcp/index.astro` still pins
`v0.1.0-e8e0f10`. That surface is unchanged by this operation and continues to
run the older Moss, including its text-glyph icons. Moving it to `3020636` is a
larger change, because the theme engine dropped its named presets and the
dashboard would need the icon layer, so it is left for a separate operation.

