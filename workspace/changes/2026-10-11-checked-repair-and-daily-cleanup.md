# Install the checked workspace repair and enable canary-gated daily cleanup

- Status: applied
- Verified: partly
- Checked: PR #148 and merged main 00f78f02c70bdd693785849e650b4fd0c8acc5d9 passed all five hosted verification jobs; main run 38164966608 binds the exact source. Installed-byte readback matched the clean checked installation clone; fresh installed canary restored its synthetic task and its marker matches the installed source hash. Task registration and independent settings readback passed. Pre-install files and disabled task XML retained externally.
- Not checked: Future unattended daily execution; its actual scheduled receipt must establish that outcome. No general cleanup or forced task start was used as verification.
- When (UTC): 2026-10-11T18:46:24.6404864Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler `\BrandoRiv Workspace Manager Cleanup`
- Previous: Installed source 340d3b35ecf0358009f40ac09fc2da1896f533d1; script SHA256 A20867540D845C731A37CAD20B8E9352A1882E8F08712A4428ACA830EE0B6E10; manifest SHA-256 0086DC53D32093CCC2F6FA60B123C72263E1FD3D7B0B79821FDE3F2E974AFE86; daily task Disabled.
- Deployed: Checked source 00f78f02c70bdd693785849e650b4fd0c8acc5d9; installed script SHA-256 8996BA023953DC0BDDA43C8A9E1609A2DAA8FB303F7B10E8779BBBCE2EF4F1BC; manifest SHA-256 C62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2; daily task Ready, purge off.
- Supersedes: 2026-10-11-workspace-manager-reconcile.md
- Operation: 2026-10-11-checked-workspace-install
- Source: PR #148; exact main 00f78f02c70bdd693785849e650b4fd0c8acc5d9; hosted main CI38164966608

## Intent

Brandon explicitly approved publishing the prepared repair, installing its exact checked merge, and enabling daily cleanup only after the actual installed canary succeeds. PR #147 integrated the approved source but failed a hosted native-Git fixture; deployment skipped and installation was held. PR #148 removes native stdin encoding from both tree fixtures. All five contexts now pass on the exact merged main, and all five are required by strict main protection.

Install only the checked clean source and manifest. Compare installed bytes, run the installed synthetic quarantine-and-restore canary using private TEMP state and a real private bare remote, verify its fresh marker and source hash, then register the existing daily 03:15 local Interactive/Limited task with StartWhenAvailable, IgnoreNew and a 15-minute limit. Purge stays off. No manual general cleanup or forced task start is part of verification. Preserve unrelated leases, stashes and pending transactions.

## Outcome

Installation from the clean checked main clone succeeded. Fresh installed canary d3b6e022c61349da8855f334ba925bd6 completed at 2026-10-11T18:46:20.739978Z, quarantined and restored its private synthetic task, and retained the fixture at C:\Users\Brandon\AppData\Local\Temp\wm-canary-d3b6e022. Its marker sourceSha256 matches the installed script. A second byte readback after the canary remained unchanged before enabling the task.

Registered and independently read back the daily 03:15 local task: Ready, Brandon Interactive/Limited, StartWhenAvailable, IgnoreNew, PT15M; exact scheduled action has -Apply and no AllowPurge. No manual general cleanup, forced scheduled-task start or purge occurred. Future unattended execution remains unclaimed.

The planning clone used LF script bytes with SHA-256 8804ABB953CFECE10239525AEF7E073B8DBF31F49B9CF7152254FA6E7427E2E4; the clean installation clone used CRLF bytes with SHA-256 8996BA023953DC0BDDA43C8A9E1609A2DAA8FB303F7B10E8779BBBCE2EF4F1BC. Both normalize to exact checked Git blob e7b51a1c26eb86460df0f48e7038e36c92a8c07e. Installed bytes matched the latter clone exactly; this is a checkout line-ending difference, not a source change.

Hosted Cloudflare deployment job 114545840673 also succeeded on main run 38164966608. Pre-install rollback copies are retained at C:\Workbench\ai-artifacts\2026-10-11\software-factory-completion\workspace-install-rollback-340. Restore those files and the disabled task XML only for recovery; it reinstates older safeguards.
