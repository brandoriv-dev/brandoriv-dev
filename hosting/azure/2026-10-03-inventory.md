# Shared subscription ownership register: Azure inventory

> Correction (2026-10-06): both resources below are gone. `RG-BigLift-NonPROD` was deleted on 2026-10-04 and `NetworkWatcherRG` on 2026-10-06. See the [2026-10-06 inventory](2026-10-06-inventory.md). This record is preserved as observed on 2026-10-03.

Record version: 1.0.0
Audit date: 2026-10-03 (America/New_York)
Recorded: 2026-10-04 UTC
Status: reconstructed inventory; no provider operations applied.
Repository: https://github.com/brandoriv-dev/brandoriv-dev
Subscription: `a3fefd88-bd76-40bf-9f2b-6f87dc707790`
Source revision inspected: 5db22167804285899f32917077d1911c9f15be20
Deployed application version: unknown; resource existence is not a deployment receipt.

## Resources (2)

Canonical targets combine subscription, resource group, provider type and name.

| Name | Provider type | Group / region | Purpose |
|---|---|---|---|
| `plan-BigLift-dev` | `Microsoft.Web/serverFarms` | `RG-BigLift-NonPROD` / centralus | Hosting compute |
| `NetworkWatcher_centralus` | `Microsoft.Network/networkWatchers` | `NetworkWatcherRG` / centralus | Shared network diagnostics |

## Likely deployment paths

Confirmed source files; presence does not prove which command created a live resource:

- [Azure/changes/2026-09-11-harness-deployment-baseline.md](changes/2026-09-11-harness-deployment-baseline.md)

```powershell
# Local validation/read-only commands; mutating examples stay commented.
az resource list --resource-group NetworkWatcherRG --output table
az appservice plan show --resource-group RG-BigLift-NonPROD --name plan-BigLift-dev --output json
```

Original operator parameter sets/run IDs remain unknown where no journal/receipt supplies them. Templates/workflows are likely repeatable paths, not reconstructed execution proof. Do not replay mutating commands during an audit.

## Observations and verification

NetworkWatcher_centralus is shared subscription diagnostics. plan-BigLift-dev is paid B1 compute with zero sites. No BigLift repository was found among managed/accessible project repositories; application ownership and original deployment script remain unresolved.

Evidence: read-only Azure CLI resource inventory, function bindings/job triggers, storage subresource names, authentication/identity metadata, and GitHub default-branch source inspection. Database records: [baseline](../database/2026-10-03-inventory.md). Live data, exact historic commands and external-provider success remain unverified. This documentation change can be reverted in Git; resource/data recovery requires the owning runbook and verified recovery evidence.
