# Shared subscription ownership register: Azure inventory

Record version: 1.0.0
Observed at (UTC, ISO 8601): 2026-10-06T11:15Z to 2026-10-06T11:30Z
Recorded: 2026-10-06 UTC
Status: reconstructed inventory; no provider operations applied by this record.
Repository: https://github.com/brandoriv-dev/brandoriv-dev
Subscription: `a3fefd88-bd76-40bf-9f2b-6f87dc707790`
Source revision inspected: 7ab4faf1e70f6a4ba3c285ae6775a9b6375ca6da
Deployed application version: unknown; resource existence is not a deployment receipt.
Supersedes/corrects: [2026-10-03 inventory](2026-10-03-inventory.md) (preserved unchanged apart from a correction link).

## Resources (0)

This register no longer holds any Azure resources. Both resources listed on
2026-10-03 are gone:

| Name | Provider type | Group | Status (observed 2026-10-06) | Removal |
|---|---|---|---|---|
| `plan-BigLift-dev` | `Microsoft.Web/serverFarms` | `RG-BigLift-NonPROD` | `az group exists` returns `false` | Group deleted 2026-10-04. Actor and exact time are not in any repository record found; the date comes from the 2026-10-06 read-only consolidation report |
| `NetworkWatcher_centralus` | `Microsoft.Network/networkWatchers` | `NetworkWatcherRG` | `az group exists` returns `false` | Group deleted by Claude on 2026-10-06 (subscription has no VNets); authoritative record is bstack's [2026-10-06 consolidation record](https://github.com/brandoriv-dev/bstack/pull/81) |

The BigLift Entra registration (`brandorivdev-BigLift-…`) is also absent from
`az ad app list --all` [observed]. No BigLift repository was ever found, so
nothing else in this repository depended on it.

## Likely deployment paths

None remain for this register. The read-only commands used for this audit:

```powershell
az group list --query "[].name" -o tsv
az group exists -n RG-BigLift-NonPROD
az group exists -n NetworkWatcherRG
az resource list --query "[].resourceGroup" -o tsv
```

`NetworkWatcherRG` is Azure-managed. Inferred: Azure recreates it automatically
the next time a virtual network is created in the subscription.

## Outcome and maintenance

Verification and observed UTC outcome: read-only Azure CLI checks at
2026-10-06T11:15Z to 11:30Z; see the [ownership register](2026-10-06-ownership-register.md).
Remaining drift/unknowns: who deleted `RG-BigLift-NonPROD`, and when exactly.
Rollback/recovery limits: neither group can be restored; `NetworkWatcherRG` is
recreated by Azure on demand, and BigLift had no known source repository.
Related Database/operation/CI record: [Database baseline](../Database/2026-10-03-inventory.md) (unchanged).
