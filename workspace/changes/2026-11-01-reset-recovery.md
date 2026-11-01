# Restore WorkspaceManager after the Windows reset

- Status: applied
- Verified: partly
- Checked: clean source cloned at 057dbb8661a705b539e8246c3ece9bc27e3b8cd6; original installed script SHA256 matches source; fresh exclusive lease and heartbeat observed; current-profile configuration and ten lease regression checks passed.
- Not checked: unattended cleanup and purge are deliberately not enabled; public Savor release and source ingestion remain separate work.
- When (UTC): 2026-11-01T19:53:32Z
- Actor: Codex for Brandon Rivera
- Target: `C:/Users/brand/AppData/Local/BrandoRiv/WorkspaceManager` and `C:/Workbench` canonical brandoriv.dev, cicd and savor baselines
- Previous: manager and C:/Workbench absent after reset
- Deployed: source correction 01bb984 with script SHA256 2BE554D7BA42544B55EBE05FB0374D4CF8547677384FC737C64AC7B2E22BAE59 and manifest SHA256 3C7A162F5EEC1D0F4E2F3A5C6D6ED8000B2F8D1576CB37A7003D66C753C602F8

## Intent

Brandon explicitly requested restoration/fix of the lost workspace manager so approved Savor work can proceed. Bootstrap from a clean source checkout is the recovery exception needed before the first managed clone exists; normal lease rules remain in force afterward. No shared ownership, protection or approval gate is removed.

## Outcome

Reconstructed initial-install evidence: the standard installer restored the manager in audit-only mode. Source and installed script SHA256 both D399F6D6667A80390725777CE4DD2620C57B53F84C0683E9FC72BB1281E4FA98. Fresh task 3f18da93d03c4bc9bc8941234d265cab acquired its real exclusive lease with an observed heartbeat.

Restored three missing canonical baselines. Private clone attempts initially waited in Git Credential Manager; terminated only those two owned process trees, configured Git to reuse the existing authenticated gh credential helper, and completed both baselines from live remote refs. No credential values were emitted. Git author identity was restored from the authenticated account with its GitHub noreply email.

The source manifest hardcoded the old Brandon profile. Resolve its quarantine root through LOCALAPPDATA instead, with a regression against the current account. This is a source-managed correction, not a hand-edited installed manifest. Install the committed correction using the existing installer; verify byte identity, lease ownership, heartbeat, and exact lifecycle completion. Scheduler remains unchanged and no purge is authorized or enabled.

## Rollback

Final verification: the committed correction was installed through the standard installer and both installed hashes matched source. Fresh CICD task 90f93b0b89e7495fabba297e80a2888a verified keeper PID/start, heartbeat and exclusive handle; Savor task 8120b580592e4ac9bfe053335135f1ee also allocated successfully. The installed canary quarantined/restored its private synthetic fixture and retained it at C:/Users/brand/AppData/Local/Temp/wm-canary-804b0c18. Health reports installation ready and no maintenance run history, as expected with scheduling disabled. No actual project cleanup or purge ran.

Reinstall original commit 057dbb8661a705b539e8246c3ece9bc27e3b8cd6 through its installer. It restores the old hardcoded quarantine path; keep maintenance disabled until the path is corrected. Preserve all task clones and user files.
