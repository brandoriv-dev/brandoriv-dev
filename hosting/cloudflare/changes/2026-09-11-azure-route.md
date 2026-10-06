# Publish the Harness route and fix its Worker cache options

- Event time (UTC): PR #18 merged at `2026-09-11T11:54:51Z`; PR #21 merged at
  `2026-09-11T22:01:56Z`. The recovered later Cloudflare deployment was created at
  `2026-09-11T22:02:52.563685Z`; the initial route publication time is unknown.
- Recorded on (UTC): 2026-09-12.
- Record type: reconstructed.
- Actor: preceding Harness implementation session for source changes; Cloudflare
  Workers Builds is the repository's configured publication mechanism. A specific
  provider deployment actor was not independently recovered for this record.
- Targets: Cloudflare Worker `brandoriv-dev`, `brandoriv.dev/harness*`, Azure origin
  `https://func-harness-46a2966d0128.azurewebsites.net`.
- Status: both changes merged, the later Worker deployment recovered, and public
  owner API access verified on 2026-09-12. Complete browser sign-in remains unverified
  by the evidence retained in this backfill.
- Related record: [Azure backend baseline](../../azure/changes/2026-09-11-harness-deployment-baseline.md).

## Reason and change

[PR #18](https://github.com/BrandoRiv/brandoriv-dev/pull/18) added the website's
private Harness proxy. Before it, the website had no Harness route. The committed
configuration adds `brandoriv.dev/harness*`, Worker-first asset routing for
`/harness` and `/harness/*`, and the `HARNESS_ORIGIN` variable pointing to Azure.
The proxy preserves the path and required authentication flow, strips supplied
identity headers, forwards selected Azure authentication cookies, and disables
caching. The Azure service enforces owner access.

Initial public requests returned 502 because the Cloudflare runtime rejected the
combination of `cache: "no-store"` and `cf.cacheTtl: 0` on the upstream request.
[PR #21](https://github.com/BrandoRiv/brandoriv-dev/pull/21) removed the conflicting
`cf` cache override and added a test in the actual Worker runtime.

## Execution and evidence

| Change | Source revision | Merge revision |
| --- | --- | --- |
| Route/proxy, PR #18 | `bda37bda5c5da6e8389b9292cd72ea69aa7668ee` | `93ae5fb71fa85db5810c3a1b32836bdb88e69d1d` |
| Worker cache fix, PR #21 | `a674753` | `4ade193c59d2ea5087b7521d28383c4e92da8cc4` |

Git history establishes the merge revisions and timestamps. The relevant source is
[`mcp/harness.ts`](../../../mcp/harness.ts), its
[test](../../../mcp/harness-test.mjs), [`mcp/worker.ts`](../../../mcp/worker.ts), and
[`wrangler.jsonc`](../../../wrangler.jsonc). The repository deployment instructions
describe Cloudflare auto-publication from `main`; a merge alone is not proof that
the provider published that exact revision successfully. A read-only Cloudflare
check on 2026-09-12 recovered deployment
`346d5d03-7b10-4a4a-ba43-c351f3497386`, created at the timestamp above, with version
`5da6751f-91d5-4344-8773-46da8fed4eb1` receiving 100% of traffic. The provider source
SHA was not included in the recovered evidence, so the merge-to-version mapping
is not independently established here.

The preceding implementation session reproduced the cache exception in the Worker
runtime. The committed regression exercises that runtime, whereas an ordinary
Node fetch had not exposed the conflicting cache options.

Public-route checks on 2026-09-12 returned owner API 200, anonymous API 401, expected
dashboard HTML/JavaScript/CSS, and a successful browser-origin POST. An ordinary
unauthenticated browser GET returned 302 to Microsoft with the correct
`https://brandoriv.dev/harness/.auth/login/aad/callback` redirect URI. Cloudflare
account ownership was also checked. These results establish the proxy and initial
login redirect; they do not establish completed interactive owner sign-in.

## Rollback

No rollback is recorded. Revert an affected proxy/configuration change through the
normal checked PR and Cloudflare publication flow, preserving concurrent MCP and
portfolio changes. Restore a verified proxy revision for a regression; rolling back
PR #21 alone would restore the known cache error. A website rollback does not
remove the Azure backend or restore its authentication configuration.

## Drift and follow-up

Routes and the origin variable are tracked in `wrangler.jsonc`. The Cloudflare
auto-build connection lives outside Git and has not been independently audited for
this record. Record the next provider deployment ID and current anonymous API,
owner API, and interactive callback checks. Any later authentication-cookie fix
must have its own actual publication and validation record; uncommitted work is
not included in this historical event.
