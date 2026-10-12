# Keep scheduled cleanup within its existing run budget

- Status: applied
- Verified: partly
- Checked: PR #155 and exact merged main passed all five required PR checks and the main CI run; native manager fixtures passed; installed script and manifest bytes match checked main; source-bound canary passed; task readback confirmed the 03:15 action with `MaxTasks 10`, `CleanupBudgetSeconds 600`, and purge off. Two actual scheduled-action runs quarantined seven tasks with no purge.
- Not checked: a naturally triggered 03:15 run has not yet been observed; five completed clones remain safely retained for local changes/stashes or unpublished Bstack history, pending handoff/publication and another scheduled run. This account could not create a literal symbolic-link test fixture; the live and dangling junction tests exercised the same `ReparsePoint` attribute path.
- When (UTC): 2026-10-12T02:52:28Z
- Actor: Codex for Brandon Rivera
- Target: `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager\workspace-manager.ps1`; existing Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: installed manager script SHA-256 `320BC78DE567ABF9789535192A5CE9C17774B43B072C15A73FA9D962B212647D`; existing daily task at 03:15 local, `MaxTasks 10`, 600-second cleanup budget, purge off
- Deployed: Main `e9f928a2e6666ab2bd0936024bfd93fd2450770e`; installed script SHA-256 `0CA2B326849CAB34FB9C0D1FAF68B42935CEA0DB45A3200A1F39A98F86137BE0`; manifest SHA-256 `C62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2`; fresh canary `a679c2c6a1ac4ed7a893369fdad3bb86` passed at `2026-10-12T02:38:30Z`. The Ready task retained its 03:15 local schedule, Limited/Interactive principal, ten-task cap, 600-second budget, and purge-off action.
- Operation: 2026-10-12-cleanup-path-check-performance
- Source: PR #155 head `5944327b68b230a6a27f8c363c551202843b842e`; merge `e9f928a2e6666ab2bd0936024bfd93fd2450770e`; main CI run `38196374931`

## Intent

The installed scheduled cleanup exhausted its existing 600-second budget while hashing a completed clone with `node_modules`. The path safety check runs for every file and directory in the integrity manifest. Its current PowerShell-provider walk took 0.976 seconds for 100 representative files at depth 8–9; a native .NET attribute lookup and parent walk took 0.069 seconds on the same paths, a 14.2× reduction with the same reparse results. The change catches only file-not-found and directory-not-found exceptions, continues checking each ancestor, and lets access-denied and other I/O errors fail closed.

The source merged with all five required checks green. The guarded installer captured the prior installed manager, manifest, install metadata and task definition; installed the exact checked source; verified installed bytes; and passed a fresh source-bound canary. The existing 03:15 local task, batch size 10, 600-second budget and purge-off action were preserved. The first actual scheduled-action run lasted 600.031 seconds, quarantined three clones and deferred with zero `NeedsReview` holds. A second run lasted 102.624 seconds, quarantined four more and retained five tasks that need handoff, stash preservation or published-history reconciliation. Both receipts show purge off. The completed source clones remain preserved; do not raise the budget or enable purge.

## Outcome

The installed source identity and task readback are recorded above. The two actual runs on exact installed source `e9f928a2e6666ab2bd0936024bfd93fd2450770e` quarantined seven completed clones in total and left five protected holds. The next Bstack history-preservation PR is still pending; a naturally scheduled daily run has not yet been observed. No purge occurred. Receipts are in `C:\Workbench\ai-artifacts\2026-10-11\cleanup-path-check-performance\scheduled-task-run-receipt.json`, `scheduled-cleanup-outcome.json`, `scheduled-task-run-2-receipt.json` and `scheduled-cleanup-outcome-2-sanitized.json`.
