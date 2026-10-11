# Reinstall the manager with a byte-bound canary gate

- Status: applied
- Verified: partly
- Checked: Main CI run `38167817029` passed all five required contexts and Cloudflare verification; rollback capture; installed script and manifest bytes; fresh installed canary and matching marker hash; registered task state and settings
- Not checked: Future unattended daily execution; only its actual scheduled-run receipt can verify that. No manual task start, general cleanup, or purge was used.
- When (UTC): 2026-10-11T19:25:52.2271042Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: Installed manager source `00f78f02c70bdd693785849e650b4fd0c8acc5d9`; script SHA-256 `8996BA023953DC0BDDA43C8A9E1609A2DAA8FB303F7B10E8779BBBCE2EF4F1BC`; manifest SHA-256 `C62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2`; daily task Ready, Interactive/Limited, 03:15 local, StartWhenAvailable, IgnoreNew, 15-minute limit, purge off
- Deployed: source `a2e0a670f453e14e03d275ffa5bfd5c07857a8fd`; installed script SHA-256 `89B58F6052CBCF1B51639FFA5AA807A2F5EB206353ABA4E7D0153A13A2725E6A`; installed manifest SHA-256 `C62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2`; daily task Ready, Brandon Interactive/Limited, 03:15 local, StartWhenAvailable, IgnoreNew, 15-minute limit, purge off
- Operation: 2026-10-11-canary-bound-manager-reinstall
- Source: PR #150; exact main `a2e0a670f453e14e03d275ffa5bfd5c07857a8fd`; main CI run `38167817029`

## Intent

The existing success marker stores the manager source hash, but task registration and scheduled `-Apply` do not compare it with the current manager bytes. A stale marker could therefore authorize re-registration or applied cleanup after the installed script changes. The source repair makes both gates compare the marker hash with the relevant installed or executing script.

After the source repair merges with all five required checks passing, temporarily disable the existing daily task and capture its current script, manifest, installation metadata, and task definition as rollback inputs. Install the exact checked merged main, read back the installed bytes, run a fresh installed-source canary, and verify its marker hash matches those bytes. Re-enable the same daily task only after that verification passes, preserving its existing principal, schedule, settings, and purge-off behavior. Do not run general cleanup or purge; preserve unrelated leases, stashes, and pending transactions.

## Outcome

The existing daily task was temporarily disabled and rollback inputs were retained at `C:\Workbench\ai-artifacts\2026-10-11\software-factory-completion\workspace-install-rollback-canary-source-binding`. The exact checked main source and manifest were installed, and independent installed-byte readback matched the recorded hashes. Fresh canary `a0a303b67e644c97a92f054a595fae2b` completed at `2026-10-11T19:25:48.7578938Z`, quarantined and restored its private fixture at `C:\Users\Brandon\AppData\Local\Temp\wm-canary-a0a303b6`, and its marker hash matched the installed manager bytes.

The existing daily task was re-enabled and independently read back as Ready for Brandon with an Interactive/Limited principal, daily 03:15 local trigger, StartWhenAvailable, IgnoreNew, and a 15-minute limit. Purge remains off. No general cleanup or purge was run. Future unattended execution remains unverified.
