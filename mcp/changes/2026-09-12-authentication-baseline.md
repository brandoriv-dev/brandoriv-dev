# MCP authentication configuration baseline

- Event time (UTC): source changes merged at `2026-09-11T16:33:44Z` (PR #19) and
  `2026-09-11T17:59:11Z` (PR #20). External configuration event times are unknown.
- Recorded on (UTC): 2026-09-12.
- Record type: reconstructed source baseline; not a verified external change log.
- Actor: the source changes came from another implementation session. The actor
  who configured Entra and Cloudflare secrets was not recovered for this entry.
- Targets: Cloudflare Worker `brandoriv-dev`, `/mcp`, and its Microsoft application.
- Status: repository configuration established; external settings and complete
  personal Microsoft sign-in were not independently verified by this record.
- Source/action references:
  [PR #19](https://github.com/BrandoRiv/brandoriv-dev/pull/19), merge
  `43fa2cd888095bb4ed992838a98d217b634e6271`; and
  [PR #20](https://github.com/BrandoRiv/brandoriv-dev/pull/20), merge
  `535ff16956b72319e4f2f7123fb1afc116e630ad`.

## Reason and intended configuration

PR #19 adds personal Microsoft account sign-in to the browser dashboard, alongside
the existing bearer-token path. PR #20 makes connection credentials available on
the authenticated Connect view and hides the console until sign-in. These are
verified source-history facts, not evidence of a secret being written or a provider
deployment completing.

The tracked [`wrangler.jsonc`](../../wrangler.jsonc) identifies client application
`e9532d95-f974-4d3e-87d3-df451284981c` through `MICROSOFT_CLIENT_ID` and defines
`DASHBOARD_ALLOWED_EMAILS`. The [MCP runbook](../README.md) requires an Entra Web
redirect URI of `https://brandoriv.dev/mcp/auth/callback`, support for personal
Microsoft accounts, and the Cloudflare secrets `MICROSOFT_CLIENT_SECRET` and
`MCP_BEARER_TOKEN`. This baseline records those setting names and requirements only.

## Execution and validation evidence

Git confirms the two merges, their timestamps, and their checked-in implementation
and tests. The source includes OIDC signature, state, nonce, audience, issuer,
expiry, and allowlist checks. It also includes dashboard and MCP protocol checks.
Test presence alone is not a report of a current passing run.

No retained provider operation ID, secret-rotation receipt, Entra configuration
readback, or completed interactive sign-in transcript was recovered for this
entry. No external action was performed while writing it. The creation time,
previous values, and live state of the external identity settings remain unknown.

## Rollback

No rollback is recorded. Revert source behavior through a checked PR and normal
Cloudflare publication, preserving unrelated Harness changes. A source revert does
not undo Entra settings or secret rotations. Restoring those requires the prior
approved provider configuration and the responsible operator; no secret values or
prior secret versions are stored in this journal.

## Drift and follow-up

Future changes must record actual Entra/Cloudflare operations, setting names,
source and provider deployment IDs, and sanitized validation results. At the next
authentication operation, compare the live registration and configured setting
names with the runbook, then record the result without exporting credentials.
Keep browser sign-in and bearer-authenticated MCP transport validation separate.
