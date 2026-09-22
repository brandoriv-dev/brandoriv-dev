# Re-vendor the authenticated Moss catalog at Moss 3020636

- Status: planned
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

Pending.
