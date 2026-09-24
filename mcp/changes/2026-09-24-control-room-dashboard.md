# Publish the Control Room MCP dashboard

- Status: planned
- Verified: not checked
- Checked: The full repository build and the MCP Playwright suite passed locally before publication.
- Not checked: Production publication and live route behavior are pending; Codex will verify the public health route and dashboard assets after deployment, while an owner-authenticated production render remains a manual owner check.
- When (UTC): 2026-09-24
- Actor: Codex for repository owner Brandon Rivers
- Target: Cloudflare Worker `brandoriv-dev`, including `https://brandoriv.dev/mcp` and its dashboard assets
- Previous: Cloudflare Workers deployment `1a14ecbe-4f62-49bf-8098-4c8d05a582bd`, version `2932c365-992a-4db7-90c9-c70b0067f66d`
- Deployed: pending
- Source: branch `agent/mcp/f56f3ec4ea4541dc8f0cdfddf0f49e07`, commits `afe72d3` and `a4292c5`

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

Pending publication and live verification.

## Rollback

Restore Cloudflare Worker version `2932c365-992a-4db7-90c9-c70b0067f66d`, or
revert the dashboard commits on `main` and republish.
