# Ledger route on the website Worker

## Intended operation

- Intended UTC date: after the Ledger Function App deployment (see `ledger/Azure/changes/2026-09-21-initial-deployment-plan.md`)
- Actor: Brandon, via the `main` auto-deploy or `wrangler deploy`
- Target: Cloudflare Worker `brandoriv-dev`; add route `brandoriv.dev/ledger*`, `run_worker_first` entries for `/ledger` and `/ledger/*`, and the `LEDGER_ORIGIN` var
- Purpose: front the private Ledger dashboard at `https://brandoriv.dev/ledger` with the same edge transport as `/harness`
- Source revision: branch `ledger-proxy` (generalised `mcp/harness.ts`, `mcp/worker.ts`, `wrangler.jsonc`, `mcp/harness-test.mjs`, README)
- Pre-deployment verification: `bun run mcp:check` passed; `bun run harness:test` passed (12 cases, including the new Ledger prefix, header, cookie-path, redirect, 503 and 502 cases)
- Steps: (1) merge this branch; `/ledger` then answers 503 "Ledger is not configured." because `LEDGER_ORIGIN` is empty and no Harness behaviour changes; (2) after the Function App exists, set `LEDGER_ORIGIN` to `https://func-ledger-<suffix>.azurewebsites.net` in `wrangler.jsonc` and deploy; (3) run `node scripts/smoke.js` from the `ledger` repository and sign in by hand at `https://brandoriv.dev/ledger`
- Planned verification: `bun run mcp:smoke` for `/mcp`; a browser request to `/harness` still redirects to Microsoft sign-in; `/ledger` returns 503 before step 2 and the Ledger sign-in redirect after it
- Rollback: redeploy the previous Worker version; the route can be removed from `wrangler.jsonc` without affecting `/mcp` or `/harness`

## Outcome

- Status: completed
- Completed UTC: PR #46 merged 2026-09-21T23:34:35Z as `61eea72`; Cloudflare Workers Build for `main` reported success and the public route answered from the new Worker by about 23:45Z
- Actor: Claude Code (Opus 5) on Brandon's behalf; Cloudflare auto-deploy on `main`
- Actual result: `brandoriv.dev/ledger*` route, `run_worker_first` entries, and `LEDGER_ORIGIN=https://func-ledger-56d29fa3500e.azurewebsites.net` are live. The branch was merged with `origin/main` first (PR #47 had landed meanwhile); conflicts in `README.md` and `mcp/harness-test.mjs` were resolved by keeping both sides, and the merged suite passed 14 proxy cases, `mcp:check`, routing and dashboard tests, plus the GitHub Actions `Policy and dashboard checks` and `MCP smoke test`.
- Verification: before the build finished, `GET /ledger/api/overview` returned 404 from static assets (the route did not exist yet); afterwards it returned 401 with `Cache-Control: private, no-store`; a browser-style `GET /ledger/` returned 302 to Microsoft sign-in with `redirect_uri=https://brandoriv.dev/ledger/.auth/login/aad/callback`; `node scripts/smoke.js` from the `ledger` repository passed against `https://brandoriv.dev/ledger` (anonymous 401, owner 200, browser-origin sync, assets); `/mcp/health` still reports 1.11.1 and `/harness/api/overview` still returns 401 anonymously.
- Not verified: completing the interactive owner sign-in in a browser.
- Remaining difference: none between `wrangler.jsonc` and the deployed Worker.
- Rollback: redeploy the previous Worker version or revert `61eea72`; `/mcp` and `/harness` are unaffected either way.
