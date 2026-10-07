# Bullfrog dashboard rewrite deployment

- Event time (UTC): 2026-09-23T00:46:39Z
- Recorded on (UTC): 2026-09-23T00:44:53Z
- Record type: contemporaneous
- Actor: Codex on Brandon Rivera's behalf
- Environment and targets: Cloudflare Workers production, `brandoriv-dev`, `https://brandoriv.dev/mcp`
- Status: applied and verified
- Source/action references: Bullfrog implementation `19ae41d`; production merge `48cc6363bdd99dab019c46a8a5897a61c50d9400`; Cloudflare versions `721071ab-b321-4aea-ace5-759c7a5a6bca` and `6c6bdda9-1c8c-470b-87ce-e52b7a8fd1df`; `bun run deploy`
- Related records: [MCP external changes](README.md)

## Reason and change

Publish the ground-up Bullfrog UI/UX rewrite while retaining the current MCP dashboard information, authenticated policy editing, notifications, connection setup, and the vendored Moss runtime contract. The release merges the rewrite onto `origin/main` so it also retains the newer Moss catalog, rail, icon, theme, and redirect behavior.

Before this operation, Cloudflare reported production version `0db3ad2a-b3f7-49ba-bdf7-6f3456b83597`, created at 2026-09-23T00:33:31Z. The intended after state is the Bullfrog application shell, benchmark-led overview, redesigned policy and connection workspaces, split authentication experience, and persistent phone navigation.

## Execution

Ran `bun run deploy` from merge `48cc636`. Wrangler uploaded 16 new or changed assets and published Cloudflare version `721071ab-b321-4aea-ace5-759c7a5a6bca` to the `brandoriv.dev/mcp*`, `/harness*`, `/ledger*`, and `/moss*` routes. The main-branch publication automation then produced version `6c6bdda9-1c8c-470b-87ce-e52b7a8fd1df`; the live Bullfrog shell and stylesheet remained identical after that publication. No secret values or authenticated response bodies were retained.

## Validation and evidence

The full production build passed 36 Microsoft-auth checks, 10 answer-study checks, 61 dashboard checks, 7 policy-store checks, 41 routing checks, 14 Harness/Ledger proxy cases, all 383 deterministic policy patterns, Astro diagnostics, and the static build.

Live validation after publication observed:

- `GET https://brandoriv.dev/mcp` returned `200`, `Cache-Control: no-store`, the restrictive dashboard CSP, the Bullfrog title, asset version `2.0.0`, the pinned Moss runtime, the split authentication story, and Microsoft sign-in.
- `GET /mcp/dashboard.css?v=2.0.0` returned `200`; the response contained the Bullfrog benchmark composition, Moss semantic bridge, and three-destination mobile navigation.
- Unauthenticated `GET /mcp/dashboard/data` returned `401` with `Cache-Control: no-store`.
- Unauthenticated `GET /moss/` returned `302` to `/mcp?next=%2Fmoss`, preserving the catalog authentication flow.
- `origin/main` resolved to `48cc6363bdd99dab019c46a8a5897a61c50d9400`.

Authenticated policy editing and token reveal were covered by local contracts but were not exercised against the production account session during this operation.

## Rollback

Restore Cloudflare version `0db3ad2a-b3f7-49ba-bdf7-6f3456b83597`, or redeploy the preceding verified main revision `ce82b60`. Policy data remains in its existing durable store and is not modified by this UI release.

## Drift and follow-up

No source or configuration drift observed. The follow-up documentation commit may trigger an identical history-only rebuild; per the operation-history convention, that does not require a recursive deployment record. The future trading-strategy leaderboard is a product direction only and is not part of this release.
