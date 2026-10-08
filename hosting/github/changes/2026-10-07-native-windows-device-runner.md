# Run the owner-authored Windows fixtures on Brandon's device

- Status: applied
- Verified: partly
- Checked: actual GitHub run 37713859900 job 113105734396 passed both fixture suites with 66 assertions at source 4e307eac65a687dd3f52df88ae7f571caaa86a1b; its short work directory was removed afterward; runner 34 unregistered and fresh runner 39 came online; scheduled task remains running; official archive checksum and native preflight verified
- Not checked: full workstation restart
- When (UTC): 2026-10-08T01:10:09Z
- Actor: Codex for Brandon Rivera
- Target: GitHub repository `brandoriv-dev/brandoriv-dev`, runner label `brandoriv-windows`, device `DESKTOP-FFHBMGE`, limited interactive logon task and owned runtime under `C:\Users\Brandon\Documents\BrandoRiv\ActionsRunner\brandoriv-windows`
- Previous: the required Windows fixture job uses GitHub-hosted windows-2025
- Deployed: limited interactive task `BrandoRiv Windows Device Runner`; fresh per-job registrations with short owned work directories; actual full fixture gate passed; no global Git configuration change
- Operation: native-windows-device-runner

## Intent

Brandon requested pointing the pipelines to this device. Preserve the actual
Windows fixture gate by running it on Windows. The native runner selector permits
only BrandoRiv as triggering actor; pull requests must also belong to this
repository and have BrandoRiv as their author. Other public contributor checks
use free standard GitHub-hosted Windows runners, preserving the required gate.

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
installation.

The next actual GitHub run passed both suites: 66 assertions on runner 34,
job 113105734396 in run 37713859900, for source
4e307eac65a687dd3f52df88ae7f571caaa86a1b. Its work directory was removed,
the runner unregistered, and runner 39 came online. The timeout fixture now
crosses its deadline deterministically after hashing; it retains the same
running-health and interrupted-work assertions without relying on a short sleep.

## Rollback

Restore this job's windows-2025 selection through a PR, stop only its supervisor
after confirming the runner is idle, and unregister this operation's exact runner
ID. Preserve journals and any unrelated workspace or task data.
