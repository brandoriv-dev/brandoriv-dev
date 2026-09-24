# Install the local workspace manager

- Status: applied
- Verified: partly
- Checked: source tests passed after each correction; synthetic canary `6aebc9a7edcf4f2d97b27f34aac2b089` quarantined, integrity-checked, restored, and removed; scheduled task `BrandoRiv Workspace Manager Cleanup` ran combined cleanup-and-purge mode at `2026-09-24T04:42:14Z` with result `0`; health was written at `2026-09-24T04:42:17.3372287Z` with `lastSuccess: true`; the run retained all three integrity-verified quarantines because their recorded timestamps were under seven days; real allocations `f3c52b147ef8494488472bb8a16a3e51`, `dbf3a0f06b6d45e08b9851518881d5da`, and `9c7d6e349bc6478cb0bb13c65c4dd78a` cloned and pushed exclusively leased task branches from current `origin/main`; seven prior clean agent directories were moved out of Workbench to recoverable legacy quarantine; failed allocation `f62865817802498a991fc5bd76f2d5a6` was integrity-manifested and moved by the manager to its seven-day quarantine after its no-op remote branch was deleted
- Not checked: unattended execution at the next daily trigger and automatic purge after the full seven-day retention period
- When (UTC): 2026-09-24T04:42:17.3372287Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation, `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager`; fixed clones under `C:\Workbench`
- Previous: no managed workspace-manager installation recorded
- Deployed: source revision `d57596ad41b6f6a87370dc62eda5901dd22c347d`; installed path `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager`; daily cleanup and seven-day retained-quarantine purge at 03:15 local as Brandon with `StartWhenAvailable` and `IgnoreNew`
- Operation: 2026-09-23-cicd-agent-hygiene

## Intent

Agents had been using shared and stale worktrees, causing lost context and
unsafe cleanup decisions. The manager supplies an independent-clone allocator,
exclusive leases, audit-only canonical baselines, and quarantine-first cleanup.
Cleanup remains fail-closed, honors exclusive leases, and quarantines before the
retention clock can lead to a verified purge.

## Outcome

The manager is installed and the scheduled cleanup is enabled. Live integration
testing exposed and corrected targeted-canary scope, PowerShell 5.1 Task
Scheduler enum and principal normalization, complete task metadata, native Git
stderr handling, and scheduled retention purge in PRs `#87` through `#93`.
Each failed registration rolled back or failed closed; no active or dirty task
was deleted.

The fixed clones remain audit-only. The dirty Moss catalog branch was reported
and preserved exactly as required. Work now starts in normal independent clones
under `C:\Workbench\.tasks`, each with a pushed branch and exclusive lease.
The manager does not run `git clean`, reset work, delete stashes, force-push, or
delete remote branches. The seven older agent directories remain recoverable at
`%LOCALAPPDATA%\BrandoRiv\WorkspaceLegacyQuarantine\20260924-0423`.
