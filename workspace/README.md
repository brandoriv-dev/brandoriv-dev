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

The manager never runs `git clean`, `git reset`, deletes stashes, force-pushes,
or deletes remote branches. Expired task clones are moved to a quarantine
outside `C:\\Workbench` before their seven-day retention period begins.
