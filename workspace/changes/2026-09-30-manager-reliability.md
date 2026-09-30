# Recover workspace lifecycle without unnecessary publication

- Status: applied
- Verified: partly
- Checked: local-only bootstrap allocation succeeded; 28 independent manager integration checks and focused reporter checks passed in Windows PowerShell 5.1; installed manager, reporters, and Workbench instructions match their source SHA-256 hashes; installed completion, repeated completion, and resume succeeded against this real task; scoped installed reporting sees the owned task clone
- Not checked: the legacy test suite was not executed because it pushes and deletes fixtures, outside this request's scope; unattended scheduler execution and long-term token savings remain unmeasured
- When (UTC): 2026-09-30T11:58:55Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation, `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager\workspace-manager.ps1`, `C:\Workbench\scripts\workbench-agent-contract.ps1`, `C:\Workbench\scripts\workbench-health.ps1`, and `C:\Workbench\AGENTS.md`
- Previous: allocator pushed empty branches; PID reuse and lock contention blocked lifecycle calls; handoff reports omitted task clones
- Deployed: manager SHA-256 `65D40DEC68993E213AC918631DF29779874E19F216053219F9E4CC90AFEADC1E` and reporters installed from task `7917b6923bb247e996ffea5de70df045`; no remote publication; scheduler configuration unchanged
- Operation: 2026-09-30-manager-reliability

## Intent

Three independent reviewers agreed to repair the existing manager before
introducing Worktrunk. Allocate locally, recover stale lease ownership without
killing unrelated processes, tolerate ordinary concurrency, preserve unfinished
tasks after lease expiry, and report the workspace that owns the changes.

## Bootstrap

The old allocator could not create the required isolated clone without a push.
The installed script was backed up under
`C:\Workbench\ai-artifacts\2026-09-30\workspace-manager-reliability` and only its
allocation push was removed before invoking the installed manager. It allocated
task `7917b6923bb247e996ffea5de70df045` with an exclusive lease. No fixed clone
was edited and no branch was pushed.

## Outcome

The manager and task-scoped reporters are installed locally. Allocation is
local-only, completion is repeatable, and exact-ID resume reopens retained local
handoffs after validating their branch, origin, and available exclusive lease.
Stale PIDs are recovered without stopping unrelated processes. Locks use bounded
waits. Cleanup retains unfinished tasks and closed tasks with local changes,
stashes, or commits lacking a cached remote-tracking copy.

The reporters expose local commits, stashes, Git errors, and GitHub query errors;
global PR queries are cached by repository. Workbench instructions now allow a
local committed handoff when publication is not authorized. Tracked source and
local backups preserve the previous installation. Existing user work, stashes,
remote branches, and deployment workflows are preserved; no files were deleted.
The scheduler was not reconfigured. Cached refs are not fresh proof that a
remote copy still exists.

Evidence is retained under the bootstrap artifact directory, including the final
28-check fixture `manager-integration-a3620c8dde6043cc97756c16304b9133`. Rollback
requires restoring the backed-up local files; a Git revert alone does not change
the installed tools.
