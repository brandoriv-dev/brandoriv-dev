# Bootstrap the device runner workspace

- Status: partial
- Verified: partly
- Checked: clean audit clone created at C:\Workbench\brandoriv.dev; the repository's Workspace Manager installed in audit-only mode; exclusive task ac387c4f3cc044c78b6790090c071021 allocated successfully; Docker startup failed on a stale sailor-ingest.sock runtime socket
- Not checked: Docker recovery and runner startup
- When (UTC): 2026-10-07T23:43:03Z
- Actor: Codex for Brandon Rivera
- Target: Windows device DESKTOP-FFHBMGE; C:\Workbench\brandoriv.dev; %LOCALAPPDATA%\BrandoRiv\WorkspaceManager; Docker Desktop runtime directory %LOCALAPPDATA%\Docker\run
- Previous: no Workbench baseline or installed Workspace Manager on this device; Docker Desktop stopped
- Deployed: audit baseline and Workspace Manager from main 5a5fcc0ef9c16b2006fea0e420d69207b642faef; local exclusive task ac387c4f3cc044c78b6790090c071021; Docker engine unavailable

## Intent

Use the repository's independent-clone manager before editing the runner setup.
The initial manager installation is reconstructed from successful command output;
it copied the existing installer without changing its source or enabling cleanup.

Docker is already installed. Recover its startup by stopping the failed session
and preserving its stale runtime directory under a dated backup name. Do not
reset Docker, remove images or volumes, or overwrite existing runtime backups.

## Outcome

Workspace allocation succeeded. Docker's backend reported that the Windows
runtime socket could not be accessed or renamed. Runner setup is pending.
