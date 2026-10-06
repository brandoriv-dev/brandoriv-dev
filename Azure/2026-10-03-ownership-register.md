# Azure resource ownership register

> Correction (2026-10-06): superseded by the [2026-10-06 ownership register](2026-10-06-ownership-register.md). Since this record, BigLift and `NetworkWatcherRG` were deleted, the applications were relabelled Bullfrog, Terrarium, and Slow and Steady, and `bstack-monthly-40` is scoped to `rg-bstack` only rather than shared; a subscription-wide `subscription-monthly-50` budget now exists. This record is preserved as observed on 2026-10-03.

Record version: 1.0.0
Audit date: 2026-10-03 (America/New_York)
Subscription: `a3fefd88-bd76-40bf-9f2b-6f87dc707790`
Scope: 60 returned ARM resources; associated Entra registrations are additional tenant objects.

| Group | Resources | Repository / association | Evidence |
|---|---:|---|---|
| `rg-bstack` | 28 | [bstack](https://github.com/brandoriv-dev/bstack/blob/main/Azure/2026-10-03-inventory.md) | Existing templates, workflow targets and GitHub federation / application tags |
| `rg-morningpilot` | 9 | [Bullfrog / Morning Pilot](https://github.com/brandoriv-dev/bullfrog/blob/main/Azure/2026-10-03-inventory.md) | Existing templates, workflow targets and GitHub federation |
| `rg-agent-harness` | 7 | [Terrarium / Agent Harness](https://github.com/brandoriv-dev/terrarium/blob/main/Azure/2026-10-03-inventory.md) | Existing templates, workflow targets and GitHub federation |
| `rg-ledger` | 7 | [Slow and Steady / Ledger](https://github.com/brandoriv-dev/slow-and-steady/blob/main/Azure/2026-10-03-inventory.md) | Existing templates, workflow targets and GitHub federation |
| `rg-moss` | 7 | [Moss](https://github.com/brandoriv-dev/moss/blob/main/Azure/2026-10-03-inventory.md) | Existing templates, workflow targets and GitHub federation |
| `NetworkWatcherRG` | 1 | Shared subscription; documentation kept here | Azure regional diagnostics |
| `RG-BigLift-NonPROD` | 1 | **Unresolved project repository**; register kept here | BigLift name/Entra registration; no matching accessible project repository found |

Linked records are part of this cross-repository PR set; main-branch links become available when the corresponding PRs merge. This register is an association record, not an Azure tag or ownership mutation.

## Associated Entra registrations

- Trading Agent - func-morning-c5x342omkhrku: Bullfrog owner sign-in.
- Harness - func-harness-46a2966d0128: Terrarium owner sign-in.
- Ledger - func-ledger-56d29fa3500e: Slow and Steady owner sign-in.
- Moss - func-moss-7b5a92e0b4c1: catalog sign-in.
- Bstack owner sign-in, Bstack staging owner sign-in, Bstack Cloudflare runtime: bstack production/staging identity and cross-cloud runtime bootstrap.
- brandorivdev-BigLift-01d2f67b-905b-476a-bea0-f4c515410ea3: legacy BigLift association; repository unresolved.

Shared controls: bstack-monthly-40 budget is $40/month; no resource locks were returned. All five storage accounts require HTTPS/TLS 1.2 and disable public blobs/shared keys. Key Vault key/certificate enumeration was denied. No database contents or secrets were exported.

Current data ownership is recorded in each project's Database/README.md. Terrarium's Bullfrog table access is a read-only dependency. This repository's old Harness deployment journal remains historical evidence rather than current data ownership.
