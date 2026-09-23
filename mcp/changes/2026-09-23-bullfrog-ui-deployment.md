# Bullfrog dashboard rewrite deployment

- Event time (UTC): pending
- Recorded on (UTC): 2026-09-23T00:44:53Z
- Record type: contemporaneous
- Actor: Codex on Brandon Rivera's behalf
- Environment and targets: Cloudflare Workers production, `brandoriv-dev`, `https://brandoriv.dev/mcp`
- Status: planned
- Source/action references: Bullfrog implementation `19ae41d`; production merge revision pending; `bun run deploy`
- Related records: [MCP external changes](README.md)

## Reason and change

Publish the ground-up Bullfrog UI/UX rewrite while retaining the current MCP dashboard information, authenticated policy editing, notifications, connection setup, and the vendored Moss runtime contract. The release merges the rewrite onto `origin/main` so it also retains the newer Moss catalog, rail, icon, theme, and redirect behavior.

Before this operation, Cloudflare reported production version `0db3ad2a-b3f7-49ba-bdf7-6f3456b83597`, created at 2026-09-23T00:33:31Z. The intended after state is the Bullfrog application shell, benchmark-led overview, redesigned policy and connection workspaces, split authentication experience, and persistent phone navigation.

## Execution

Planned command: `bun run deploy` from the merged, tested production revision. No secret values or authenticated response bodies will be retained.

## Validation and evidence

Before publication, the merged source passed the 61-check MCP dashboard contract and Astro diagnostics. The full production build, Cloudflare deployment identifier, public shell/assets, and live smoke evidence are pending.

## Rollback

Restore Cloudflare version `0db3ad2a-b3f7-49ba-bdf7-6f3456b83597`, or redeploy the preceding verified main revision `ce82b60`. Policy data remains in its existing durable store and is not modified by this UI release.

## Drift and follow-up

Pending deployment and live verification. The future trading-strategy leaderboard is a product direction only and is not part of this release.
