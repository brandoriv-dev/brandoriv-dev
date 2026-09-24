# Install the local workspace manager in audit-only mode

- Status: planned
- Verified: not checked
- Checked: source tests are intended to exercise path validation, leases, quarantine, and fail-closed cleanup
- Not checked: installed copy, scheduled task registration, and destructive canary; those require a deliberate workstation operation after merge
- When (UTC): 2026-09-23T00:00:00Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation, `%LOCALAPPDATA%\\BrandoRiv\\WorkspaceManager`; fixed clones under `C:\\Workbench`
- Previous: no managed workspace-manager installation recorded
- Deployed: pending merge and explicit installer run
- Operation: 2026-09-23-cicd-agent-hygiene

## Intent

Agents have been using shared and stale worktrees, causing lost context and
unsafe cleanup decisions. This change supplies an independent-clone allocator,
exclusive leases, audit-only canonical baselines, and quarantine-first cleanup.
The source is being prepared before the external install; no scheduler or
destructive cleanup is run by this commit.

## Outcome

The source, manifest, tests, and installer are present in this branch. External
installation is intentionally still pending and must record its actual path,
canary result, and health check in the outcome of this record.

