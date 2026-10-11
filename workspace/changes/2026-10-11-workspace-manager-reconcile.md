# Reconcile the installed Workspace Manager

- Status: partial
- Verified: partly
- Checked: canonical main/origin revision, installed source and manifest hashes, task state/settings; manager metadata/lease compatibility; canary remote-publication boundary and isolated test behavior; full manager test suite passes with the fixture repair; production health hash stayed unchanged during the final test
- Not checked: repaired-source install, fresh installed-source canary/marker/hash, task re-registration/enablement, unattended execution; these require the owner to review and publish the source repair, then rerun the installed canary
- When (UTC): 2026-10-11T13:26:00Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation; installed manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: installed script SHA-256 `EF253E4935B36F7B40D208861AFF1AE086E9808A0FC4429773AD678DF09838B0` (exact blob from source commit `48e2de1`); manifest SHA-256 `A65EF1FD0F6374DD3E61756DF8DCE00771FCC710BD09CDB4927D53F4D9874DBE`; task Disabled, daily 03:15 local, interactive Limited principal, StartWhenAvailable, IgnoreNew, 15-minute limit; last result `267014`; existing canary marker from 2026-09-24
- Deployed: canonical source `340d3b35ecf0358009f40ac09fc2da1896f533d1`; installed script SHA-256 `A20867540D845C731A37CAD20B8E9352A1882E8F08712A4428ACA830EE0B6E10`; installed manifest SHA-256 `0086DC53D32093CCC2F6FA60B123C72263E1FD3D7B0B79821FDE3F2E974AFE86`; task remained Disabled and unchanged
- Operation: 2026-10-11-workspace-manager-reconcile
- Source: canonical `brandoriv-dev/brandoriv-dev` main `340d3b35ecf0358009f40ac09fc2da1896f533d1`; rollback inputs retained under `C:\Workbench\ai-artifacts\2026-10-11\workspace-manager-reconcile\rollback\`

## Intent

The installed script was stale relative to canonical main. The installed hash matched `48e2de1`; current main and `origin/main` were `340d3b35`. The newer source adds bounded cleanup and stronger preservation checks while keeping the v1 manifest, task metadata, lease, lifecycle, canary-proof, and task-registration interfaces compatible.

The approved reconciliation installs the canonical script and manifest, verifies their exact hashes, runs a fresh synthetic quarantine-and-restore canary, validates the marker, then re-registers the existing daily cleanup task. Preserve the existing account, daily 03:15 schedule, StartWhenAvailable, IgnoreNew, Limited interactive principal, and 15-minute limit. Do not run general cleanup or purge, and preserve active leases.

The external rollback copies capture the pre-change installed script, manifest, install metadata, and scheduled task XML. The normal rollback unit restores those files and the disabled task definition; this would reinstate the older manager safeguards and is therefore for recovery only, not the preferred steady state.

## Outcome

Canonical install and exact source/manifest readback succeeded. The task remains Disabled, so no scheduled cleanup was enabled or run. The fresh installed-source canary failed closed at the unchanged preservation boundary: the synthetic fixture advertised only a cached `refs/remotes/origin/main` while its origin was the real GitHub repository, so `git ls-remote` correctly found no locally verifiable live ref. The existing test harness had overridden `Get-LiveRemoteRefs` with cached refs and did not exercise the canary path.

A source-only repair is prepared in the owning manager lease. The canary now uses a unique local bare remote and pushes its synthetic branch before invoking the unchanged live-ref preservation logic. The test suite invokes the actual canary/quarantine/restore path with isolated task, state, and remote roots. The lock-timeout child test now gives only the child process a temporary `LOCALAPPDATA`, keeping the real global mutex test while avoiding writes to production manager health. Full `-Mode test` passed after these changes, and a before/after SHA-256 check proved the test run left production `health.json` unchanged. The repaired source is not installed yet; a fresh installed-source canary and successful health readback remain prerequisites to task enablement.

The same source change sends only the secret-free verification jobs to GitHub-hosted Windows/Linux runners; the production deploy job remains restricted to a trusted main push on the isolated device runner. This allows PR validation without weakening deployment trust or credential boundaries.
