# Worker source (formerly the personal MCP server)

The personal MCP server that lived here at `https://brandoriv.dev/mcp` was retired
on 2026-09-30 (credentials, Entra app and secrets removed) and its code was removed
on 2026-10-12. The directory keeps its name because the Worker entry point is
recorded as `mcp/worker.ts` in deployment history.

What remains:

| File | Purpose |
|---|---|
| `worker.ts` | Worker entry: `/mcp*` 410 tombstone, `/ledger` proxy, `/moss` catalog, static assets |
| `harness.ts`, `harness-test.mjs` | The `/ledger` transport proxy and its tests (`bun run harness:test`) |
| `moss-catalog-check.mjs`, `moss-catalog-test.mjs` | Moss bundle integrity and live-release gate (`bun run moss:check`, `moss:live`, `moss:test`) |
| `vendor-moss.mjs` | Re-vendors the Moss catalog into `public/moss` |
| `route-smoke.mjs` | Route status smoke test against `wrangler dev` (`bun run routes:smoke`) |

## Historical notes

The MCP server's architecture, client setup, policy evaluation and answer-study
documentation is preserved in Git history: read this file at `36b2430` or earlier.

Correction (2026-10-12): earlier versions of this README described Azure Key Vault
and Azure App Configuration as the "owner-managed source of truth" for the Jev and
event-endpoint settings. That was a stated intention, not an observed state: the
coordinator's 2026-10-12 retirement review reports that no keys in App
Configuration store `appcs-bstack-brandoriv` ever backed those settings, and the
Worker never read Azure at request time. After the retirement this website has no
App Configuration or Key Vault consumer. See the
[2026-10-06 ownership register correction](../hosting/azure/2026-10-06-ownership-register.md)
and the [retirement record](../hosting/cloudflare/changes/2026-10-12-retire-mcp-surface.md).
