# Correct authenticated Moss directory redirect

- Status: completed and verified
- Recorded on (UTC): 2026-09-22
- Actor: Codex acting for Brandon
- Target: `https://brandoriv.dev/moss`
- Corrects: `2026-09-22-moss-review-and-theme-toggle.md`

## Reason and intended operation

The prior authentication-return correction exposed a second redirect loop for authenticated requests: the Worker rewrote `/moss/` to `/moss/index.html`, while Cloudflare Assets canonicalized that file URL back to the directory URL. Remove the file rewrite and let the asset binding resolve the directory index natively.

Validate dashboard/routing tests and the full build, deploy the corrected Worker, then verify both anonymous authentication routing and authenticated catalog rendering. Roll back by redeploying the preceding Worker version.

## Outcome

- Completed on (UTC): 2026-09-22 11:54
- Source revision: `10f4c09` (merge of PR #57)
- Cloudflare Worker version: `7081e769-2bec-45ef-9e0c-8e14af1fcfbf`
- Actual change: removed the `/moss/` to `/moss/index.html` Worker rewrite and delegated directory-index resolution to Cloudflare Assets.
- Verification: `bun run mcp:dashboard-test` passed 46 checks, `bun run mcp:routing-test` passed 41 checks, and the full `bun run build` passed before deployment. Production anonymous requests to both `/moss` and `/moss/` return one `302` to `/mcp?next=%2Fmoss`. A production request with a freshly issued signed dashboard session returned `200 text/html` from `/moss/`, without a `Location` header, and contained the Moss catalog marker.
- Rollback: redeploy preceding Worker version `1c19dfbd-e50f-48d4-8a4a-849a571e3f7b` if the correction must be reverted.
- Remaining difference: none for the reported redirect loop. The catalog intentionally remains private behind MCP dashboard authentication.
