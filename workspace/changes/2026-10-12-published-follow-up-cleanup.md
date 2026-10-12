# Quarantine finished published follow-up branches

- Status: applied
- Verified: partly
- Checked: native manager lifecycle/integrity/canary tests passed, including five new preservation assertions; independent review found no actionable safety regression; a read-only probe of completed CICD task `1ff84f50e2a74b8eb12af975b2c9c7c8` verified every retained commit against live main without changing HEAD or checkout status
- Not checked: the next naturally scheduled 03:15 action and future candidate cleanup; this record does not claim an always-on interactive host
- When (UTC): 2026-10-12T04:36:30Z
- Actor: Codex for Brandon Rivera
- Target: Windows installed `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager\workspace-manager.ps1`, Task Scheduler `BrandoRiv Workspace Manager Cleanup`, and retained task `1ff84f50e2a74b8eb12af975b2c9c7c8`
- Previous: installed script SHA-256 `0CA2B326849CAB34FB9C0D1FAF68B42935CEA0DB45A3200A1F39A98F86137BE0`; source `e9f928a2e6666ab2bd0936024bfd93fd2450770e`; daily 03:15 local action, ten-task cap, 600-second budget, purge off
- Deployed: installed source `8653ae44fd69414d8cd7a75135aa4c6282176a14`, script SHA-256 `99E9C1D070E1049F7A5B247DC80A062B240EC46F29AB8C01E3F2A6DBC354A491`; source-bound canary `7021c85542db459e97eff8a27155f21d` passed
- Operation: 2026-10-12-published-follow-up-cleanup
- Source: normal PR157 head `097d5068559f0a55570acb1ed8daa51667addd6b`, merged source `8653ae44fd69414d8cd7a75135aa4c6282176a14`; required PR checks `38204207934` and main checks `38204312538` all passed

## Intent

A completed CICD owner published its approved follow-up on another local branch.
Both exact branch histories reached main, but the cleaner retained the clone
solely because the current branch differed from ownership metadata. The clone
is clean, has no stashes, and retains its original manager-owned branch.

For this case, cleanup requires explicit completed or abandoned status, an
attached current branch, the original owned ref, and exactly one live advertised
main tip. Every retained local branch/tag and HEAD must be a commit ancestor of
that immutable main tip. Another advertised feature branch or tag is insufficient.
Existing path, origin, dirty/stash, lease, noncommit-ref, integrity, deadline and
bounded authenticated GitHub checks remain required. Unproven source stays put.

This proof changes neither the clone's refs nor its ownership metadata. It
permits the ordinary integrity-checked quarantine, retaining the whole clone.
Resume still requires the original owned branch; this change cannot grant an
active lease or repair a working checkout. Purge remains disabled.

## Execution and recovery

Install only the normally checked merged source, verify installed bytes and a
fresh source-bound canary, then retain the existing daily task settings. Run the
installed cleanup against the demonstrated finished task and record its actual
transaction and quarantine destination. Before installation, preserve the prior
script, manifest, installation metadata, canary and task definition. If checks
fail, restore those exact prior installation artifacts; do not mutate the held
clone. Quarantined data stays recoverable under its complete integrity manifest.

## Outcome

The checked merged source was installed at 2026-10-12T04:35:45Z after preserving prior installation bytes, canary and task XML. The fresh installed canary quarantined and restored its private fixture successfully. Installation initially registered the safe default one-task batch. Final readback caught that difference; at 2026-10-12T04:45:44Z the installed source-bound registration was reapplied with explicit `-MaxTasks 10 -CleanupBudgetSeconds 600`. The task is Ready with Limited Interactive logon, StartWhenAvailable, IgnoreNew, PT15M, the existing 03:15 Eastern trigger and purge off. The external checked installer now passes those explicit values and rejects a mismatched action readback. The actual readback receipt is `C:\Workbench\ai-artifacts\2026-10-12\workspace-published-follow-up-install\restored-ten-task-batch.json`.

Evidence: `C:\Workbench\ai-artifacts\2026-10-11\non-date-gated-completion\workspace-published-follow-up-tests.log`
and the read-only `probe-published-follow-up.ps1` result for source head
`99cb7e62cc64bb210d626537192ccf9ddfe36364`. Actual installed cleanup quarantined task `1ff84f50e2a74b8eb12af975b2c9c7c8` at 2026-10-12T04:36:30Z in 10.195 seconds, with no retained review hold and exit zero. Its full clone and integrity manifest remain at `%LOCALAPPDATA%\BrandoRiv\WorkspaceQuarantine\1ff84f50e2a74b8eb12af975b2c9c7c8`. Installation and cleanup logs, rollback bytes and prior task XML are retained in `C:\Workbench\ai-artifacts\2026-10-12\workspace-published-follow-up-install`. No permanent deletion occurred.
