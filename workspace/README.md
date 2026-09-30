# Workspace Manager

This repository contains the source for the Windows workspace manager used by
the local agents. It is deliberately conservative: the fixed clones in
`C:\\Workbench` are canonical, audit-only baselines. Work happens in a normal
independent clone under `C:\\Workbench\\.tasks\\<task-id>\\<repository>`.

The installed copy lives at
`%LOCALAPPDATA%\\BrandoRiv\\WorkspaceManager`. Run the installer from a clean
checkout; it copies the scripts and manifest, but does not register a scheduled
task. The cleanup command is audit-only unless `-Apply` is supplied, and the
first destructive canary must be quarantined and restored before unattended
cleanup is enabled.

Commands are PowerShell 5.1 compatible:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode audit
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode new-task -Repository moss
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode resume -TaskId <task-id>
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode cleanup
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode canary
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode complete -TaskId <task-id>
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode extend -TaskId <task-id> -TtlHours 24
powershell -ExecutionPolicy Bypass -File scripts/workspace-manager.ps1 -Mode test
```

The scheduled-task installer refuses `-Apply` until `-Mode canary` has created
and restored a synthetic task and recorded a machine-bound proof. `complete`,
`abandon`, and `extend` are the lifecycle controls; expiry alone never defeats
an active exclusive lease. Its daily `scheduled` mode quarantines eligible task
clones first, then purges only integrity-verified quarantines whose recorded
retention timestamp is at least seven days old.

Resume uses the exact TaskId, checks the clone's branch and origin, and refuses
to claim a live lease. An existing retained local handoff can be reopened without
creating another branch. It preserves existing files and stashes.

Allocation creates a local branch; it never pushes. Publishing the branch is a
separate action requiring explicit authorization. The starting revision is read
from the fresh clone, rather than the audit baseline's cached remote reference.

Lease expiration does not mean that an unfinished task is disposable. Active
and creating tasks are retained until an explicit lifecycle decision. Finishing
the same task twice is harmless, and a recycled Windows PID is never stopped.
The manager checks the exclusive lease before recovering ownership whose keeper
is no longer running. Ordinary concurrent calls wait for a bounded interval
instead of failing immediately.

The tracked Workbench reporters live in `scripts/workbench-agent-contract.ps1`
and `scripts/workbench-health.ps1`. Use `-RepositoryPath <leased-clone-path>` for
an owned task's handoff and `-Root C:\Workbench` for a global audit. Git and
GitHub failures are reported as unknown/error rather than clean or zero PRs.

The manager never runs `git clean`, `git reset`, deletes stashes, force-pushes,
or deletes remote branches. Eligible closed task clones are moved to quarantine
outside `C:\\Workbench` before their seven-day retention period begins. Keep a
local committed handoff available until it has been published or backed up.
