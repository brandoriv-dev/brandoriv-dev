# Run the owner-authored Windows fixtures on Brandon's device

- Status: applied
- Verified: partly
- Checked: official Windows archive checksum and native preflight verified; lifecycle fixtures passed in actual GitHub jobs; cleanup fixtures exposed a 272-character Git object path; work directory shortened to an owned USERPROFILE/brw/GUID path (213-character object path); cleanup boundaries and junction self-tests pass; fresh runner 31 is online and prior per-job runtime directories were removed
- Not checked: successful actual cleanup fixture run after work-directory fix
- When (UTC): 2026-10-08T01:10:09Z
- Actor: Codex for Brandon Rivera
- Target: GitHub repository `brandoriv-dev/brandoriv-dev`, runner label `brandoriv-windows`, device `DESKTOP-FFHBMGE`, limited interactive logon task and owned runtime under `C:\Users\Brandon\Documents\BrandoRiv\ActionsRunner\brandoriv-windows`
- Previous: the required Windows fixture job uses GitHub-hosted windows-2025
- Deployed: limited interactive task `BrandoRiv Windows Device Runner`; fresh runner 31 `DESKTOP-FFHBMGE-brandoriv-windows-9e1a57f1`; short owned work directory; no global Git configuration change
- Operation: native-windows-device-runner

## Intent

Brandon requested pointing the pipelines to this device. Preserve the actual
Windows fixture gate by running it on Windows. The workflow permits only
BrandoRiv as triggering actor; pull requests must also belong to this repository
and have BrandoRiv as their author. External fork code cannot run on this runner.

This limited native runner has the host Windows account's access; it is not a
container or a host isolation boundary. Use it only for these trusted owner
fixtures. Keep the private fleet on its separate private-only organization
group and the portfolio Linux jobs in containers. Give each Windows runner one
job and a fresh verified installation directory, then safely dispose only its
own directory. Supply the short-lived repository registration token through the
runner's documented input environment variable and clear it before listening.
Never supply the host GitHub credential to a job.

## Outcome

The native scheduled task passed preflight and now runs the official update
wrapper persistently. Its first runtime registered successfully and is online.
Actual GitHub execution passed the integration lifecycle fixtures, then exposed
a native Git path limit in the deeper runtime work directory. The owned work
directory now uses a shorter USERPROFILE/brw/GUID path, with separate bounded
cleanup for runtime and work roots. The supervisor was restarted only after
the current runner was confirmed idle. No job was interrupted and fixture
expectations remain intact. Each job receives a fresh registration and
installation. Rechecking the full fixture gate is pending the next PR run.

## Rollback

Restore this job's windows-2025 selection through a PR, stop only its supervisor
after confirming the runner is idle, and unregister this operation's exact runner
ID. Preserve journals and any unrelated workspace or task data.
