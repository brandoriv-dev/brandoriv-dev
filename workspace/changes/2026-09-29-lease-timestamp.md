# Correct workspace lease start-time comparison

- Status: applied
- Verified: checked
- Checked: compared recorded UTC timestamps with the live lease processes; patched source completed both previously blocked leases through `-Mode complete`; full synthetic manager suite passed, including expired cleanup and retention; installed SHA-256 matches source; installed `-Mode health` reported healthy
- Not checked: nothing
- When (UTC): 2026-09-29T19:37:51.7269055Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation, `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager\workspace-manager.ps1`
- Previous: SHA-256 `711A26C9A26DAF36169A28B44BBF329E9F624C91AEABB83BA130E0BE0A0590B5`
- Deployed: SHA-256 `D78E86C3F88814D2CE0AEF45786CB5316E8996D0B82226D294CA8DAC253EF39D`; scheduler unchanged

## Intent

`ConvertFrom-Json` materializes stored UTC timestamps as `DateTime` objects. Parsing those objects again interpreted their display strings as local time and shifted comparisons by four hours. The guard falsely reported that a live lease PID had been reused, and cleanup considered expired leases unexpired. Preserve the PID start-time guard and retention checks while comparing the original UTC instants.

## Outcome

The corrected script was installed locally. The bstack lease `a9548a85e0f0462fadcb4d09fc3e76d0` and Bullfrog lease `9eafa7ec18674f3a85c010ed70bd2cad` now have `completed` metadata. The PID guard still checks process start time before stopping a lease; the recorded UTC instant is preserved. Expired leases now enter quarantine when safe. Reinstalling the prior script hash is the local rollback if needed.
