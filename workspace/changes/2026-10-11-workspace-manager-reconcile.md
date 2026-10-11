# Reconcile the installed Workspace Manager

- Status: planned
- Verified: not checked
- Checked: canonical main/origin revision, installed source and manifest hashes, task state/settings, v1 manager metadata/lease compatibility, canonical isolated test suite, and external rollback inputs
- Not checked: post-install hash and health, fresh canary result, enabled task settings, and unattended execution
- When (UTC): 2026-10-11
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation; installed manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: installed script SHA-256 `EF253E4935B36F7B40D208861AFF1AE086E9808A0FC4429773AD678DF09838B0` (exact blob from source commit `48e2de1`); manifest SHA-256 `A65EF1FD0F6374DD3E61756DF8DCE00771FCC710BD09CDB4927D53F4D9874DBE`; task Disabled, daily 03:15 local, interactive Limited principal, StartWhenAvailable, IgnoreNew, 15-minute limit; last result `267014`; existing canary marker from 2026-09-24
- Deployed: pending the operation
- Operation: 2026-10-11-workspace-manager-reconcile
- Source: canonical `brandoriv-dev/brandoriv-dev` main `340d3b35ecf0358009f40ac09fc2da1896f533d1`; rollback inputs retained under `C:\Workbench\ai-artifacts\2026-10-11\workspace-manager-reconcile\rollback\`

## Intent

The installed script is stale relative to canonical main. The installed hash matches `48e2de1`; current main and `origin/main` are `340d3b35`. The newer source adds bounded cleanup and stronger preservation checks while keeping the v1 manifest, task metadata, lease, lifecycle, canary-proof, and task-registration interfaces compatible. The canonical isolated test suite passed before this operation.

Install only the canonical script and manifest, verify the exact installed hash and manager health, run a fresh synthetic quarantine-and-restore canary against the installed source, verify its marker and script hash, then re-register the existing daily cleanup task using the canonical installer. Preserve the existing account, daily 03:15 schedule, StartWhenAvailable, IgnoreNew, Limited interactive principal, and 15-minute limit. Do not run general cleanup or purge, and preserve active leases.

The external rollback copies capture the pre-change installed script, manifest, install metadata, and scheduled task XML. The normal rollback unit restores those files and the disabled task definition; this would reinstate the older manager safeguards and is therefore for recovery only, not the preferred steady state.

## Outcome

Pending the approved install, canary, and task registration.
