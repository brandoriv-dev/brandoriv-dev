# Dashboard typography deployed

- Event time (UTC): PR #26 merged at `2026-09-14T03:11:18Z`; Cloudflare created
  the deployment at `2026-09-14T03:12:02.091343Z`.
- Recorded on (UTC): 2026-09-14.
- Record type: contemporaneous completion of [the typography plan](2026-09-14-dashboard-typography-plan.md).
- Actor: Codex through the owner's GitHub and Cloudflare workflow.
- Target: `https://brandoriv.dev/mcp`.
- Status: deployed and verified.
- Source: [PR #26](https://github.com/BrandoRiv/brandoriv-dev/pull/26), implementation
  `ed35c4bd605d3be0197bc97148d2338595a3e1e0`, merge revision
  `5fe92dc8b99aa47fdf0850d591e5666a03f17f00`.
- Provider deployment: `1dbd10e6-7f13-4e1f-88e2-3813e55816ce`; Worker version
  `c89edda8-eb81-4683-ae92-6cfa9c33596e`, receiving 100% of traffic.

Body copy and operational data use the native monospace stack. Headings,
navigation, forms, buttons, labels, and actions use the clean sans-serif stack.
No font asset or network request was added. The attempted embedded-font approach
was rejected locally because it violated the existing `font-src 'self'` policy and
was removed before commit or publication.

The complete build and 40 local browser checks passed in both themes across all
three authenticated fixture views and signed-out state at 320, 390, and 1440 pixels,
with no overflow, JavaScript, or CSP errors. PR checks passed. At
`2026-09-14T03:13:08.741Z`, 19 live signed-out checks passed and version 1.6.0 assets
returned 200; private dashboard data returned 401. Cloudflare's existing injected
analytics beacon remained blocked by `script-src 'self'`; application assets passed.
No live sign-in or form submission was attempted.

No rollback was performed. Revert this typography commit through a checked PR to
restore the preceding fonts. No MCP policy, secret, identity, Azure, authentication,
or deployment setting changed. A documentation-only follow-up may rebuild identical
runtime assets under the shared history convention.
