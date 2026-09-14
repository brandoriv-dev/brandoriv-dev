# Material dark theme and mobile navigation deployed

- Event time (UTC): PR #24 merged at `2026-09-14T02:58:50Z`; Cloudflare created
  the deployment at `2026-09-14T02:59:44.440932Z`.
- Recorded on (UTC): 2026-09-14.
- Record type: contemporaneous completion of [the refinement plan](2026-09-13-material-dark-theme-plan.md).
- Actor: Codex through the owner's GitHub workflow; Cloudflare Workers Builds published the Worker.
- Target: `https://brandoriv.dev/mcp`.
- Status: deployed and verified.
- Source: [PR #24](https://github.com/BrandoRiv/brandoriv-dev/pull/24), implementation
  `acda2254b3299e84bef2dac709201e5bf4e61e7e`, merge revision
  `e14222fcc6651482de8643ffe88eb3f79237cd61`.
- Provider deployment: `81f851ad-95dd-4ccd-9dfd-728c1f9462dd`; Worker version
  `2f30b84a-304f-432e-810a-3ec5144e1145`, receiving 100% of traffic.

The dark appearance now uses neutral Material-style layers and evergreen accents.
Overview, Policies, and Connect retain their logical sequence—current state,
governing behavior, then setup—and become direct bottom tabs on phones. The hidden
mobile drawer was removed. Sign-in, authentication, and MCP behavior are unchanged.

The complete build passed, including MCP, authentication, routing, Harness proxy,
policy, type, and Astro checks. Forty local browser checks covered signed-out and
authenticated fixtures, both themes, all three views, 320/390/1440-pixel layouts,
theme persistence, and sampled contrast of at least 4.5:1, with no overflow or
application errors. PR and [post-merge CI](https://github.com/BrandoRiv/brandoriv-dev/actions/runs/34801001712)
passed.

At `2026-09-14T03:01:02.309Z`, 19 live signed-out checks passed. The page and
version 1.5.0 assets returned 200, theme choices persisted across reload, mobile
layout had no horizontal overflow, and private dashboard data returned 401. The
existing injected `static.cloudflareinsights.com` analytics beacon remained blocked
by `script-src 'self'`; application assets were allowed. No live sign-in or form
submission was attempted.

No rollback was performed. Revert the presentation commit through a checked PR to
restore the preceding theme. No Azure, Entra, secret, policy, or deployment setting
changed, and no new configuration drift was identified. A documentation-only
follow-up may rebuild identical assets under the shared history convention.
