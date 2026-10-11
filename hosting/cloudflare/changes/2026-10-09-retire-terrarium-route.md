# Remove the retired Terrarium upstream from the shared Worker

- Status: planned
- Verified: not checked
- Checked: Terrarium repository and Azure resource group were deleted; source removes the upstream, route and proxy dispatch while retaining Ledger transport.
- Not checked: production route removal and deployed Worker revision; verify after the normal passing-main deployment.
- When (UTC): 2026-10-09
- Actor: Codex for Brandon Rivera
- Target: Cloudflare account 3d873c2936146d4f557d0c2b469f69ac, Worker brandoriv-dev, brandoriv.dev/harness* route and HARNESS_ORIGIN variable
- Previous: source main before this retirement change; live Worker version unrecorded
- Deployed: none

## Intent

Brandon explicitly retired Terrarium and authorized permanent repository and Azure
resource deletion. The shared website still configured the deleted Function App
as an upstream. Remove that integration through the existing reviewed deployment
path. The shared Worker, Ledger route, Moss catalog and policy namespace have
independent ownership and remain in service.

The repository's workspace manifest also stops future Terrarium task allocation.
It does not delete existing checkouts or history. Automatic approval review
rejected local recursive deletion; this source change does not bypass that block.

## Outcome

External route changes are pending normal review, passing checks and deployment.
After deployment, record the actual Worker revision and route readback here.
Removing an upstream does not reverse the already completed repository, Azure
resource-group or Entra identity deletion.

The existing live-Moss build gate exposed a stale website bundle pin:
`88c4c9421c49143b50c780e877550e8a14b67b4d` differed from verified Azure production
`8b00b5139f9f1cb502d108a78fcf83214edca297`. Synchronize the catalog and dashboard
to that exact deployed source as a prerequisite for this normal website release.
All 35 dashboard asset hashes and the 59 catalog assets, after the existing
`/moss/` base/import adaptation, match the verified source. No Moss source,
Function App, model call or release workflow was changed by this operation.
