# Shared dashboard theme deployed

- Event time (UTC): PR #23 merged at `2026-09-13T20:23:37Z`; Cloudflare created
  the production deployment at `2026-09-13T20:24:10.615955Z`.
- Recorded on (UTC): 2026-09-13.
- Record type: contemporaneous completion of [the publication plan](2026-09-13-dark-mode-plan.md).
- Actor: Codex through the owner's GitHub workflow; Cloudflare Workers Builds
  published the Worker. Codex verified the live page.
- Target: Cloudflare Worker `brandoriv-dev`, `https://brandoriv.dev/mcp`.
- Status: deployed; live signed-out theme behavior verified. Authenticated theme
  behavior was checked with a local fixture, not an interactive Microsoft login.
- Source: [PR #23](https://github.com/BrandoRiv/brandoriv-dev/pull/23), implementation
  `349913a5ea338a1e8ff02ce8faa1bf6761b76259`, merge revision
  `da7e47dd9a09a8bd7f6a3b61dc0866c96212de88`.
- Provider deployment: `abe93481-7788-4ae0-b3ab-51b5a3bf6f36`; Worker version
  `0ddf8b9e-8e1a-4303-ab88-bad8b1a8da2d`, receiving 100% of traffic.

## Change and evidence

The sign-in and console views offer System, Light, and Dark. The browser key
`brandoriv-theme` is shared with Harness. An external script resolves the choice
before CSS, follows operating-system changes in System mode, synchronizes tabs,
and remains usable when browser storage is unavailable. The asset version is
`1.4.0`. MCP authentication, policies, and identity settings were not changed.

The complete local build passed. Forty browser checks covered light/dark sign-in,
Overview, Policies, and Connect at widths from 320 to 1440 pixels, without horizontal
page overflow. Sampled text contrast met 4.5:1; keyboard focus, reload persistence,
system changes, cross-tab updates, invalid choices, and blocked storage passed.
Authenticated checks used an isolated fixture; no Connect token was recorded.

[PR CI](https://github.com/BrandoRiv/brandoriv-dev/actions/runs/34780562827) and
Cloudflare's build passed. The first
[post-merge CI attempt](https://github.com/BrandoRiv/brandoriv-dev/actions/runs/34780623036)
hit the existing randomized `microsoft-auth-test.mjs:47` tampered-cookie assertion.
Rerunning only the failed job passed on the same revision. No authentication code
or test was changed to clear that failure.

Provider evidence came from `wrangler deployments list` and GitHub check results.
At `2026-09-13T20:26:19.621Z`, 19 live checks passed. The public page and assets
served version 1.4.0, and private dashboard data still returned 401 without a
session. Signed-out theme changes, reload persistence, shared storage, and mobile
layout passed. The application had no
JavaScript exceptions. Cloudflare's injected analytics script at
`static.cloudflareinsights.com/beacon.min.js` was blocked by the existing
`script-src 'self'` policy. Theme assets were permitted. That analytics limitation
was observed separately and no CSP or analytics configuration was changed.

## Rollback and drift

No rollback was performed. Revert the MCP theme asset and page changes through a
checked PR to restore the previous appearance. Preserve unrelated MCP work and
the Harness authentication proxy. This release changed tracked assets, not Azure,
Entra, secrets, or deployment configuration; it was not a full infrastructure
drift audit.

The Azure-hosted Harness dashboard's corresponding publication is recorded in
[the Harness repository](https://github.com/BrandoRiv/agent-harness/blob/main/Azure/changes/2026-09-13-dashboard-deployed.md).
Publishing this completion record may rebuild identical runtime assets; Git/CI
history covers that documentation-only rebuild under the shared convention.
