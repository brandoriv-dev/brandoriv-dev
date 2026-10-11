# Reinstall the manager with a byte-bound canary gate

- Status: planned
- Verified: not checked
- Checked: Existing installed-manager record and planned source flow reviewed; no installed state or task was changed
- Not checked: Task disablement, rollback capture, installation from the exact merged main, installed-byte readback, fresh installed canary marker, and re-enablement; these require the owner-approved external operation after the source fix merges and all required checks pass
- When (UTC): 2026-10-11T19:15:45Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: Installed manager source `00f78f02c70bdd693785849e650b4fd0c8acc5d9`; script SHA-256 `8996BA023953DC0BDDA43C8A9E1609A2DAA8FB303F7B10E8779BBBCE2EF4F1BC`; manifest SHA-256 `C62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2`; daily task Ready, Interactive/Limited, 03:15 local, StartWhenAvailable, IgnoreNew, 15-minute limit, purge off
- Deployed: planned; no external state changed
- Operation: 2026-10-11-canary-bound-manager-reinstall

## Intent

The existing success marker stores the manager source hash, but task registration and scheduled `-Apply` do not compare it with the current manager bytes. A stale marker could therefore authorize re-registration or applied cleanup after the installed script changes. The source repair makes both gates compare the marker hash with the relevant installed or executing script.

After the source repair merges with all five required checks passing, temporarily disable the existing daily task and capture its current script, manifest, installation metadata, and task definition as rollback inputs. Install the exact checked merged main, read back the installed bytes, run a fresh installed-source canary, and verify its marker hash matches those bytes. Re-enable the same daily task only after that verification passes, preserving its existing principal, schedule, settings, and purge-off behavior. Do not run general cleanup or purge; preserve unrelated leases, stashes, and pending transactions.

## Outcome

Not performed. The source repair and this operation plan are under review; the installed manager and scheduled task remain unchanged.
