# Bootstrap the device runner workspace

- Status: partial
- Verified: partly
- Checked: clean audit clone and exclusive task allocated; stale Docker runtime directories preserved before recovery; Docker Linux engine healthy; Linux and Windows runner scheduled preflights passed with result 0; all three native logon supervisors running; actual private CI jobs executed on this device
- Not checked: full workstation restart; portfolio checks and deployment pending workflow publication
- When (UTC): 2026-10-07T23:43:03Z
- Actor: Codex for Brandon Rivera
- Target: Windows device `DESKTOP-FFHBMGE`; `C:\Workbench\brandoriv.dev`; `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager`; Docker Desktop runtime directory `%LOCALAPPDATA%\Docker\run`
- Previous: no Workbench baseline or installed Workspace Manager on this device; Docker Desktop stopped
- Deployed: audit baseline and Workspace Manager from main 5a5fcc0ef9c16b2006fea0e420d69207b642faef; exclusive task ac387c4f3cc044c78b6790090c071021; healthy Docker Linux engine and durable runner runtimes under C:\Users\Brandon\Documents\BrandoRiv\ActionsRunner

## Intent

Use the repository's independent-clone manager before editing the runner setup.
The initial manager installation is reconstructed from successful command output;
it copied the existing installer without changing its source or enabling cleanup.

Docker is already installed. Recover its startup by stopping the failed session
and preserving its stale runtime directory under a dated backup name. Do not
reset Docker, remove images or volumes, or overwrite existing runtime backups.

## Outcome

Workspace allocation succeeded. Docker initially failed on stale runtime
sockets. The affected runtime directories were preserved under dated backup
names, and Docker recovered without a factory reset or deleting images or
volumes. Native scheduled processes could not see Codex's virtualized AppData
installation, so runner scripts, GitHub CLI and its non-secret configuration
were installed under durable Documents paths. Authentication remains in the
Windows credential vault.

The public Linux, private Linux and trusted Windows supervisors passed native
scheduled preflight and are running as limited interactive logon tasks. The
private Linux fleet has already executed real central and caller checks.
See the GitHub operation journals for runner scope, labels and actual results.
The device must be signed in, awake and online to accept jobs.
