# Run the owner-authored Windows fixtures on Brandon's device

- Status: applied
- Verified: partly
- Checked: official Windows archive checksum verified; native scheduled preflight passed with result 0; cleanup boundary and junction retention self-test passed; scheduled task runs persistently; repository runner 23 is online with Windows/X64/brandoriv-windows labels
- Not checked: actual fixture job pending workflow publication; root agent will verify the PR run
- When (UTC): 2026-10-08T01:10:09Z
- Actor: Codex for Brandon Rivera
- Target: GitHub repository `brandoriv-dev/brandoriv-dev`, runner label `brandoriv-windows`, device `DESKTOP-FFHBMGE`, limited interactive logon task and owned runtime under `C:\Users\Brandon\Documents\BrandoRiv\ActionsRunner\brandoriv-windows`
- Previous: the required Windows fixture job uses GitHub-hosted windows-2025
- Deployed: limited interactive task `BrandoRiv Windows Device Runner`; ephemeral runner 23 `DESKTOP-FFHBMGE-brandoriv-windows-985bee89`
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
Actual Windows fixture execution remains pending publication of the guarded
workflow. Each new job receives a fresh runner registration and installation.

## Rollback

Restore this job's windows-2025 selection through a PR, stop only its supervisor
after confirming the runner is idle, and unregister this operation's exact runner
ID. Preserve journals and any unrelated workspace or task data.
