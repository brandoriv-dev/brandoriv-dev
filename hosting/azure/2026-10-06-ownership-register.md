# Azure resource ownership register

Record version: 1.0.0
Observed at (UTC, ISO 8601): 2026-10-06T11:15Z to 2026-10-06T11:30Z
Subscription: `a3fefd88-bd76-40bf-9f2b-6f87dc707790`
Scope: 46 returned ARM resources in 5 resource groups; associated Entra registrations are additional tenant objects.
Supersedes/corrects: [2026-10-03 ownership register](2026-10-03-ownership-register.md) (preserved unchanged apart from a correction link).
Evidence: read-only Azure CLI (`az group list`, `az resource list`, `az ad app list --all`, `az ad app owner list`, `az consumption budget list`, `az appconfig list`) and the read-only consolidation report in Workbench `ai-artifacts/2026-10-06/azure-consolidation-other-projects/report.md`. No secret or setting values were read. [O] marks direct observation; [I] marks inference.

## Corrections to 2026-10-03

- **Two groups are gone [O].** `RG-BigLift-NonPROD` was deleted on 2026-10-04 and
  `NetworkWatcherRG` on 2026-10-06. Neither group exists. See the
  [2026-10-06 inventory](2026-10-06-inventory.md).
- **Applications were relabelled [O].** The Entra display names are now Bullfrog,
  Terrarium, and Slow and Steady instead of Trading Agent, Harness, and Ledger.
  Application IDs are unchanged.
- **The bstack budget is not shared [O].** `bstack-monthly-40` is scoped to
  `rg-bstack` only (its ID is under `resourceGroups/rg-bstack`). The 2026-10-03
  register listed it under shared controls. A separate subscription-wide budget
  now exists; see [Shared controls](#shared-controls).

## Groups

| Group | Resources | Repository / association | Change since 2026-10-03 |
|---|---:|---|---|
| `rg-bstack` | 17 | [bstack](https://github.com/brandoriv-dev/bstack/blob/main/Azure/2026-10-03-inventory.md) | 28 → 17 after bstack's own cleanup, including staging; bstack's records own the details |
| `rg-morningpilot` | 8 | [Bullfrog](https://github.com/brandoriv-dev/bullfrog/blob/main/Azure/2026-10-03-inventory.md) | 9 → 8: unused Smart Detection action group deleted 2026-10-06 ([Bullfrog PR #43](https://github.com/brandoriv-dev/bullfrog/pull/43)) |
| `rg-agent-harness` | 7 | [Terrarium](https://github.com/brandoriv-dev/terrarium/blob/main/Azure/2026-10-03-inventory.md) | Unchanged count |
| `rg-ledger` | 7 | [Slow and Steady](https://github.com/brandoriv-dev/slow-and-steady/blob/main/Azure/2026-10-03-inventory.md) | Unchanged count; kept, because Brandon is returning to the project |
| `rg-moss` | 7 | [Moss](https://github.com/brandoriv-dev/moss/blob/main/Azure/2026-10-03-inventory.md) | Unchanged count |

All five groups are in active use or kept on purpose. Project inventories linked
above are still dated 2026-10-03 and carry their own corrections.

## Associated Entra registrations

Current display names from `az ad app list --all` [O]:

- `Bullfrog - func-morning-c5x342omkhrku` (`45a6fcfc-6e9a-4350-a658-c789e2773fb1`): Bullfrog owner sign-in. Owner: Brandon, added 2026-10-06; it had none.
- `Terrarium - func-harness-46a2966d0128` (`7d5814db-afdc-4090-a618-1b4be6fbc4ec`): Terrarium owner sign-in.
- `Slow and Steady - func-ledger-56d29fa3500e` (`762235fb-2cd9-4f02-973c-0eca862f4eaf`): Slow and Steady owner sign-in.
- `Moss - func-moss-7b5a92e0b4c1` (`cfba68ba-62a7-4502-95d9-09719e2d1f92`): catalog sign-in. Owner: Brandon, added 2026-10-06; it had none.
- `Bstack owner sign-in` (`a284c32c-b6f2-46fc-a479-b1231bbf85a3`): bstack production identity.

No longer present [O]: `Bstack staging owner sign-in`, the retired
`Bstack Cloudflare runtime` application and its service principal, and the BigLift
registration. bstack's records own the staging and Cloudflare removals.

## Shared controls

- **`subscription-monthly-50` [O]:** new on 2026-10-06, scoped to the whole
  subscription. $50 a month. Emails `brandoriv.dev@gmail.com` at 50%, 80% and
  100% of actual spend and at 100% of forecast spend. Its authoritative creation
  record is bstack's
  [2026-10-06 consolidation record](https://github.com/brandoriv-dev/bstack/pull/81).
- **`bstack-monthly-40` [O]:** $40 a month, scoped to `rg-bstack` only, with the
  same thresholds. It remains.
- **`appcs-bstack-brandoriv` [O]:** the only App Configuration store in the
  subscription, in `rg-bstack`. It was kept during cleanup because
  [mcp/README.md](../../mcp/README.md) names Azure App Configuration as the
  owner-managed source of truth for this website's non-secret Jev settings.
  That README names the service, not the store; the link between the two is [I].

Unchanged from 2026-10-03 and not re-checked here: resource locks, storage
account HTTPS/TLS and shared-key settings, and Key Vault enumeration limits.

Current data ownership is recorded in each project's `Database/README.md`. This
repository's old Harness deployment journal remains historical evidence rather
than current data ownership.
