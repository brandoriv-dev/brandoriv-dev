# Harness Azure deployment baseline

- Event time (UTC): provisioning occurred during 2026-09-10 and 2026-09-11, with
  individual timestamps not retained here. The verified later publication ran
  from `2026-09-11T22:03:40.0918335Z` to `2026-09-11T22:04:43.7210624Z`.
- Recorded on (UTC): 2026-09-12.
- Record type: reconstructed.
- Actor: preceding Harness implementation session using the owner's Azure CLI
  context; the per-operation initiating identity was not retained here.
- Environment: production, Azure `eastus2`, resource group `rg-agent-harness`.
- Status: Azure backend applied and verified; complete browser sign-in was not
  established by the retained backend checks.
- Source/action references: sibling `agent-harness/infra/main.bicep`,
  `scripts/deploy.ps1`, `scripts/configure-entra.ps1`, and `scripts/publish.ps1`.
  The source had not yet received an initial Git commit when this baseline was
  reconstructed, so no deployed source SHA can be asserted.
- Related record: [website route](../../cloudflare/changes/2026-09-11-azure-route.md).

## Reason and change

Create a generic control plane for agents and repository projects with a private
dashboard at `https://brandoriv.dev/harness`. The initial operating policy is a
$100 monthly envelope, including $80 for external workers, with dispatch paused.
The policy is application admission control, not a hard Azure billing cap.

The retained deployment runbook records these created targets:

| Target | Resulting configuration |
| --- | --- |
| `func-harness-46a2966d0128` | Node.js 24 Functions Flex Consumption; HTTP `harness` and 15-minute `supervisor` timer |
| `stharnessnlsnchpc2pix` | Durable state in `harness-state`; packages in `harness-deployments`; identity-based access |
| `id-harness-nlsnchpc2pix` | User-assigned runtime identity |
| `appi-harness-nlsnchpc2pix`, `log-harness-nlsnchpc2pix` | Sampled telemetry, 30-day retention, configured 0.05 GB/day ingestion cap |
| Entra application `7d5814db-afdc-4090-a618-1b4be6fbc4ec` | Single-tenant owner authentication with managed identity federation |

The identity received storage access for its own host/state, telemetry publishing,
subscription Reader and Cost Management Reader, and Storage Table Data Reader on
the existing `rg-morningpilot/stc5x342omkhrku/MorningPilot` table. The trading observer
has no trading write role or broker credentials.

EasyAuth requires the configured owner and tenant on every application path.
Registered browser callbacks use `/harness/.auth/login/aad/callback` on both the
Azure origin and `brandoriv.dev`. The application and proxy share fixed forwarded
host/protocol header names. These are the retained deployment facts, not a fresh
audit of every resource setting on the record date.

## Execution

Provisioning used `agent-harness/scripts/deploy.ps1`; application revisions used
`agent-harness/scripts/publish.ps1`. Retained metadata is at local ignored
`agent-harness/.deploy-artifacts/deployment.json`. It identifies the Azure targets
but is not copied into this journal.

The retained package `harness-20260911-180006.zip` and
`agent-harness/.local/publish-fixed.log` identify the later publication. The package
filename reflects the publisher's local clock, not a UTC execution timestamp.
The log ends with successful publication after registration checks. A read-only
provider check on 2026-09-12 recovered deployment
`4216a63b-a04f-49d8-af3d-0d463ec76fba`, status `4` (success), and the start/end
timestamps above. The retained package SHA-256 is
`DEDD484A8743AA9E51522CB0A8D045AB02EC3BB2755EC1455FA428962726EB01`.

## Validation and evidence

The retained publication log reports **73 tests passed, zero failed**, successful
package publication, and the publisher's required function registration checks.
The deployment runbook records direct Azure smoke results on 2026-09-11:

- Anonymous API access returned 401; owner API access and browser-origin updates
  succeeded; dashboard HTML, JavaScript, and CSS were available to the owner.
- HTTP and supervisor timer functions were registered.
- Billing, trading, website, desktop, and resource inventory reported healthy;
  the inventory contained 16 Azure resources.
- Policy remained in observation mode with the $100/$80 envelope.

The previous session supplied those backend results. Follow-up read-only checks on
2026-09-12 verified the public route: owner API 200, anonymous API 401, expected
HTML/JavaScript/CSS, a successful browser-origin POST, and an unauthenticated browser
redirect to Microsoft with the registered public callback. Azure CLI account
inspection also matched the configured owner identity. These checks did not
complete interactive Microsoft sign-in.

Retained files cited here are local evidence, not committed audit attachments;
their summarized results and recovered deployment metadata are the durable evidence
in this backfill. Re-run `agent-harness/scripts/smoke.js` for later changes and
record each later operation separately.

## Rollback

No rollback is recorded. For an application regression, restore a retained verified
package or republish the last verified source revision through the publication
runbook, then check authentication and both function registrations. Package
rollback does not roll back durable application state. Infrastructure or identity
changes need a reviewed comparison against their prior configuration; this initial
baseline does not supply a pre-existing Harness deployment to restore.

## Drift and follow-up

The infrastructure and Entra operations are represented in Bicep and deployment
scripts, but this backfill is not an independent drift comparison. Subsequent
records belong in `agent-harness/Azure/changes/` and should include the committed
source SHA, provider deployment ID, UTC execution time, and sanitized live checks.
Browser authentication follow-ups belong in the website Harness journal, linked
to the corresponding Azure operation when both change. Full interactive sign-in
remains a separate verification step.
