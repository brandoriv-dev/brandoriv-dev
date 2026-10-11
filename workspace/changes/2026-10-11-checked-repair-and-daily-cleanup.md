# Install the checked workspace repair and enable canary-gated daily cleanup

- Status: planned
- Verified: not checked
- Checked: PR148 and merged main00f78f02c70bdd693785849e650b4fd0c8acc5d9 passed all five hosted verification jobs; main run38164966608 binds the exact source. Installed task remains Disabled. Source script and manifest hashes recorded, pre-install files and disabled task XML retained externally.
- Not checked: Installed-byte readback, fresh installed canary and marker, task registration and readback, unattended execution; Codex will perform the authorized immediate checks, with future unattended behavior requiring its actual scheduled receipt.
- When (UTC): 2026-10-11T18:45:50.5699180Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler `\BrandoRiv Workspace Manager Cleanup`
- Previous: Installed source340d3b35ecf0358009f40ac09fc2da1896f533d1; script SHA256 A20867540D845C731A37CAD20B8E9352A1882E8F08712A4428ACA830EE0B6E10; manifest0086DC53D32093CCC2F6FA60B123C72263E1FD3D7B0B79821FDE3F2E974AFE86; daily task Disabled.
- Deployed: Pending exact checked source00f78f02c70bdd693785849e650b4fd0c8acc5d9, script8804ABB953CFECE10239525AEF7E073B8DBF31F49B9CF7152254FA6E7427E2E4, manifestC62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2.
- Supersedes: 2026-10-11-workspace-manager-reconcile.md
- Operation: 2026-10-11-checked-workspace-install
- Source: PR148; exact main00f78f02c70bdd693785849e650b4fd0c8acc5d9; hosted main CI38164966608

## Intent

Brandon explicitly approved publishing the prepared repair, installing its exact checked merge, and enabling daily cleanup only after the actual installed canary succeeds. PR147 integrated the approved source but failed a hosted native-Git fixture; deployment skipped and installation was held. PR148 removes native stdin encoding from both tree fixtures. All five contexts now pass on the exact merged main, and all five are required by strict main protection.

Install only the checked clean source and manifest. Compare installed bytes, run the installed synthetic quarantine-and-restore canary using private TEMP state and a real private bare remote, verify its fresh marker and source hash, then register the existing daily03:15 local Interactive/Limited task with StartWhenAvailable, IgnoreNew and a15-minute limit. Purge stays off. No manual general cleanup or forced task start is part of verification. Preserve unrelated leases, stashes and pending transactions.

## Outcome

Pending authorized installation and canary-gated registration. Pre-install rollback copies are retained at C:\Workbench\ai-artifacts\2026-10-11\software-factory-completion\workspace-install-rollback-340. Restore those files and the disabled task XML only for recovery; it reinstates older safeguards.
