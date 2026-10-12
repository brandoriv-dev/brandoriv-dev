# Allow bounded lease startup on a loaded workstation

- Status: planned
- Verified: not checked
- Checked: Installed five-second wait failed allocation and resume; standalone PowerShell startup measured 6.889 seconds; a retained external copy changing only the keeper wait acquired a real exclusive lease; focused actual-function regressions cover delayed acquisition and refusal without acquisition
- Not checked: Protected source merge, exact checked installation, fresh installed-source canary, and unattended scheduled cleanup after installation
- When (UTC): 2026-10-12T01:00:13Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation Workspace Manager; existing daily cleanup task
- Previous: Installed script SHA-256 `89B58F6052CBCF1B51639FFA5AA807A2F5EB206353ABA4E7D0153A13A2725E6A`; keeper readiness bound five seconds
- Deployed: Not yet changed; installed manager and scheduled task remain unchanged
- Operation: 2026-10-11-lease-startup-readiness
- Source: Owned workspace task `6e7a40e23e654268bb2a3530ad52d252`; protected merge pending

## Intent

Three isolated allocations failed because the keeper did not acquire its lock
within five seconds. A read-only startup probe took 6.889 seconds. A retained
external manager copy changed only Start-Lease's readiness polling from five
to 30 seconds; its normal resume operation acquired an exclusive lease and
recorded the launched process identity. No fixed clone or installed manager
was edited, and no lock, source-bound cleanup gate or metadata check was bypassed.

Publish the canonical bound and its actual-function delayed-start/timeout
regressions through the five existing required checks. After checked main
passes, retain current installed bytes and task definition as rollback, disable
the daily task, install the exact checked source, run a fresh source-bound
installed canary, and restore the same daily schedule with a ten-task maximum,
600-second budget and purge off. The prior installer silently ignored the
requested batch options; the source fix carries them into the verified action.
Record
actual outcome separately; no scheduled execution is claimed in this plan.

## Outcome

Checked installation is pending. The successful exclusive bootstrap leases
are preflight evidence for the source repair, not deployment acceptance.

## Recovery limits

The prior installed script, manifest, marker and task XML are the rollback
unit. Reverting source does not reverse a completed quarantine move. Preserve
unrelated active leases, dirty/stashed tasks and historical evidence. The
external bootstrap copy is retained for inspection and only used for normal
allocation/lifecycle ownership; it does not install or run cleanup.
