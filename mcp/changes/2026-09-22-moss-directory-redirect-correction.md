# Correct authenticated Moss directory redirect

- Status: prepared; not yet published
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: `https://brandoriv.dev/moss`
- Corrects: `2026-09-22-moss-review-and-theme-toggle.md`

## Reason and intended operation

The prior authentication-return correction exposed a second redirect loop for authenticated requests: the Worker rewrote `/moss/` to `/moss/index.html`, while Cloudflare Assets canonicalized that file URL back to the directory URL. Remove the file rewrite and let the asset binding resolve the directory index natively.

Validate dashboard/routing tests and the full build, deploy the corrected Worker, then verify both anonymous authentication routing and authenticated catalog rendering. Roll back by redeploying the preceding Worker version.
