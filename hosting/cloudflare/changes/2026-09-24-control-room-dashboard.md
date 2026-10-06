# Publish the Control Room MCP dashboard

- Status: applied
- Verified: partly
- Checked: The full repository build and MCP Playwright suite passed locally; GitHub CI run `36005477797` passed both required jobs; Cloudflare routed 100 percent of traffic to the new version; production `/mcp/health` and `/mcp/` returned 200; the live document reported Control Room asset version `3.1.0`, included the rail arrow, and omitted the concept chooser; live CSS and JavaScript contained the two arrow states and line-based tree without dot creation.
- Not checked: Owner-authenticated production dashboard data and interactions were not exercised because no reusable signed browser session was available; the repository owner can verify them by signing in at `/mcp/`.
- When (UTC): 2026-09-24T13:25:38.016221Z
- Actor: Codex for repository owner Brandon Rivers
- Target: Cloudflare Worker `brandoriv-dev`, including `https://brandoriv.dev/mcp` and its dashboard assets
- Previous: Cloudflare Workers deployment `1a14ecbe-4f62-49bf-8098-4c8d05a582bd`, version `2932c365-992a-4db7-90c9-c70b0067f66d`
- Deployed: Cloudflare Workers deployment `b352245d-8c78-468c-bf90-8689b2d50f4e`, version `2703e66f-6f9a-4ccd-83c3-1339677b9136`, routing 100 percent of traffic
- Source: merge `34bef6cd38a249532574bf69554192c57c89cd9f`; GitHub CI run `36005477797`; Cloudflare Workers deployment `b352245d-8c78-468c-bf90-8689b2d50f4e`

## Intent

Publish the selected Control Room direction as the sole MCP dashboard experience.
The release removes the A/B/C chooser, aligns the collapsed navigation rail,
replaces its expansion glyph with a rotating minimalist arrow, and changes the
policy hierarchy from dot markers to restrained connector lines. No Cloudflare
route, binding, secret, authentication, or stored-policy change is intended.

The observed production Worker before publication was deployment
`1a14ecbe-4f62-49bf-8098-4c8d05a582bd`, routing all traffic to version
`2932c365-992a-4db7-90c9-c70b0067f66d`.

## Outcome

Merge `34bef6c` reached `main` and Cloudflare Workers Builds published it as
deployment `b352245d-8c78-468c-bf90-8689b2d50f4e`. Worker version
`2703e66f-6f9a-4ccd-83c3-1339677b9136` received 100 percent of traffic. The
production health route returned an `ok` response, `/mcp/` served the Control Room
document at asset version `3.1.0`, and the live dashboard assets contained the
selected rail and tree implementation. The direct `/mcp` protocol route retained
its bearer-authentication behavior.

The required GitHub CI run completed successfully. Its policy/dashboard and smoke
jobs repeated the repository checks after the merge. The pre-existing jobless
`answer-study.yml` startup failure was not a release gate and did not publish or
run a paid answer study.

## Rollback

Restore Cloudflare Worker version `2932c365-992a-4db7-90c9-c70b0067f66d`, or
revert the dashboard commits on `main` and republish.
