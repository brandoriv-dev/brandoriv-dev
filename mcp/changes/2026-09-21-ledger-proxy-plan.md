# Ledger route on the website Worker (planned)

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

- Status: planned; not deployed. Replace this section with the actual UTC time, Worker version, and verification results when it runs.
