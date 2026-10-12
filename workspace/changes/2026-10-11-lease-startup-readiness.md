# Allow bounded lease startup on a loaded workstation

- Status: applied
- Verified: partly
- Checked: Protected merge and all five main checks passed; installed script and manifest match checked source; fresh installed-source canary passed; ten-task/600-second scheduled action read back; manually triggered scheduler run quarantined seven tasks and retained fifteen for review
- Not checked: Naturally scheduled daily execution; automatic retention resolution; purge remains disabled
- When (UTC): 2026-10-12T01:22:21Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation installed `BrandoRiv\WorkspaceManager\workspace-manager.ps1`; scheduled task `\BrandoRiv Workspace Manager Cleanup`
- Previous: Installed script SHA-256 `89B58F6052CBCF1B51639FFA5AA807A2F5EB206353ABA4E7D0153A13A2725E6A`; keeper readiness bound five seconds
- Deployed: Script SHA-256 `90CC39930775872774AFC555B90F3ABE67D7CB2F8EC9D7D6BA8A043B9842397B`; manifest SHA-256 `C62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2`
- Operation: 2026-10-11-lease-startup-readiness
- Source: Protected merge `39d17fd817e860674eda1cb7f07f22730eae57fe`, PR 152; main check run `38191188737`

## Intent

Three isolated allocations failed because the keeper did not acquire its lock
within five seconds. A read-only startup probe took 6.889 seconds. A retained
external manager copy changed only Start-Lease's readiness polling from five
to 30 seconds; its normal resume operation acquired an exclusive lease and
recorded the launched process identity. No fixed clone or installed manager
was edited, and no lock, source-bound cleanup gate or metadata check was bypassed.

Publish the canonical bound and its actual-function delayed-start/timeout
regressions through the five existing required checks. After checked main
passes, retain current installed bytes and task definition as rollback, disable
the daily task, install the exact checked source, run a fresh source-bound
installed canary, and restore the same daily schedule with a ten-task maximum,
600-second budget and purge off. The prior installer silently ignored the
requested batch options; the source fix carries them into the verified action.
Record
actual outcome separately; no scheduled execution is claimed in this plan.

## Outcome

Protected PR 152 merged at `39d17fd817e860674eda1cb7f07f22730eae57fe`.
All five PR and main checks passed, including native Windows preservation
fixtures. The guarded installer retained the previous installed bytes, marker,
manifest and task XML outside Git, disabled cleanup during installation, and
matched the new installed bytes against the checked source before and after
the fresh installed-source canary. Canary `72892e75df144467a261e82884d2dc36`
completed at `2026-10-12T01:18:53.3502268Z` and was verified at
`2026-10-12T01:18:57.9539811Z`.

The task readback confirmed 03:15 Eastern, StartWhenAvailable, IgnoreNew,
the existing limited interactive principal, a fifteen-minute execution limit,
`MaxTasks=10`, `CleanupBudgetSeconds=600`, and purge off. A manual trigger
through Task Scheduler exercised this actual registered action. It ran from
`2026-10-12T01:20:01.6881743Z` to `2026-10-12T01:22:21.7636857Z`, quarantined
seven tasks and retained fifteen for review. The task returned deferred code
2 and returned to Ready, with its next trigger at 03:15 Eastern on October 12.
This is actual Task Scheduler execution, not a claim that a naturally scheduled
daily run has occurred.

The last retained reason was task `f82650c0e04746f69e305874cc40b934`:
local HEAD was not proved reachable from advertised remote tips. Its clean,
already merged commit is an ancestor of current main, but the completed clone
does not contain the newer main object. A separate source change will add
bounded immutable ancestry proof without fetching into completed or sealed
clones. Active leases and dirty, stashed or unpublished work remain protected.

Installation, rollback and execution evidence is retained in the external
`non-date-gated-completion` artifact under `C:\Workbench\ai-artifacts\2026-10-11`.
Purge was not enabled or exercised.

## Recovery limits

The prior installed script, manifest, marker and task XML are the rollback
unit. Reverting source does not reverse a completed quarantine move. Preserve
unrelated active leases, dirty/stashed tasks and historical evidence. The
external bootstrap copy is retained for inspection and only used for normal
allocation/lifecycle ownership; it does not install or run cleanup.
