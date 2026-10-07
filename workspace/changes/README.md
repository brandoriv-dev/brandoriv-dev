# Workspace operations

This journal records workstation-level workspace-manager installs, scheduler
changes, canaries, and recovery actions. Source changes remain in Git; this
journal records effects that a Git revert cannot undo. Never put credentials,
tokens, cookies, or environment exports here.

Use the shared fields and review rules in [hosting/README.md](../../hosting/README.md#shared-operation-record-convention).
The manager is installed manually first. A scheduled task is a separate
operation and must have its own intended and outcome record.

<!-- records:begin -->
- [Point the workspace manager at the brandoriv-dev owner](2026-10-06-manager-owner-rename.md)
- [Retire finished leases and bound scheduled cleanup](2026-09-30-workbench-followup.md)
- [Recover workspace lifecycle without unnecessary publication](2026-09-30-manager-reliability.md)
- [Correct workspace lease start-time comparison](2026-09-29-lease-timestamp.md)
- [Temporarily register Bstack with Workspace Manager](2026-09-25-temporarily-register-bstack.md)
- [Register the central CI/CD repository with Workspace Manager](2026-09-25-register-cicd-workspace.md)
- [Install the local workspace manager](2026-09-23-workspace-manager-install.md)
<!-- records:end -->
