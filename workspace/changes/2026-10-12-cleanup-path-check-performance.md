# Keep scheduled cleanup within its existing run budget

- Status: planned
- Verified: not checked
- Checked: On the PR source, the targeted Workspace Manager tests passed; on 100 representative paths at depth 8–9, the exact path check took 0.069 seconds versus 0.976 seconds before, with identical reparse results
- Not checked: hosted checks for the final PR revision, installed-source canary, scheduled task readback after installation, and a complete scheduled cleanup run on the installed source. This account could not create a literal symbolic-link test fixture; the live and dangling junction tests exercised the same `ReparsePoint` attribute path.
- When (UTC): 2026-10-12
- Actor: Codex for Brandon Rivera
- Target: `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager\workspace-manager.ps1`; existing Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: installed manager script SHA-256 `320BC78DE567ABF9789535192A5CE9C17774B43B072C15A73FA9D962B212647D`; existing daily task at 03:15 local, `MaxTasks 10`, 600-second cleanup budget, purge off
- Deployed: Planned only: exact checked merged `main`, installed-byte readback, fresh canary tied to those bytes, and preservation of the existing task settings
- Operation: 2026-10-12-cleanup-path-check-performance
- Source: PR #155 head `ba54ba0bca355a0992c5f17342005b60eedf33bf`; merge SHA pending

## Intent

The installed scheduled cleanup exhausted its existing 600-second budget while hashing a completed clone with `node_modules`. The path safety check runs for every file and directory in the integrity manifest. Its current PowerShell-provider walk took 0.976 seconds for 100 representative files at depth 8–9; a native .NET attribute lookup and parent walk took 0.069 seconds on the same paths, a 14.2× reduction with the same reparse results. The change catches only file-not-found and directory-not-found exceptions, continues checking each ancestor, and lets access-denied and other I/O errors fail closed.

After this source merges with all five required checks green, capture the prior installed manager, manifest, install metadata, and Task Scheduler definition as rollback inputs. Install the exact checked source, verify installed bytes, run a fresh source-bound canary, and preserve the existing 03:15 local task, batch size 10, 600-second budget, and purge-off action. Then verify the actual scheduled cleanup receipt and whether the completed clone with `node_modules` finishes. Do not change batch size, raise the budget, enable purge, or clean the completed source clone during validation.

## Outcome

Preparation only. No installation, task registration, scheduled run, or cleanup of the completed clone occurred in this change. Record the installed source identity, canary, task readback, and actual scheduled outcome after the operation.
