# Collaboration and external operations

Other agents may be working in this repository. Inspect Git status and remote
changes first. Use an isolated manager clone, preserve all existing stashes, and
never delete or overwrite files you did not author to clear your own path.
Untracked files are not disposable. Stage only your task's files and pull/compare
before push.

On Brandon's Windows workstation, the fixed clones under `C:\Workbench` are
audit-only baselines. Before any edit, use the installed workspace manager to
create a normal independent clone with an exclusive lease and local task branch:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\BrandoRiv\WorkspaceManager\workspace-manager.ps1" -Mode new-task -Repository brandoriv-dev
```

Use `-Repository mcp` instead when the task starts from the `C:\Workbench\mcp`
baseline. Allocation does not publish a branch. Push, merge, deploy, and deletion
require Brandon's explicit authorization in the current request. Resume an
existing task by exact TaskId rather than allocating another branch for the same
objective. Continue only in the returned path and keep its exact TaskId. Do not
create a Git worktree or edit a fixed clone. When the task is merged or stopped,
run the manager with `-Mode complete -TaskId <id>` or `-Mode abandon -TaskId <id>`;
the scheduled job performs quarantine-first cleanup and a seven-day verified
purge. If the manager is unavailable, stop rather than falling back to a shared
checkout.

Record changes outside Git under [hosting/](hosting/README.md), in the journal of
the service whose state changed:

- Azure and Entra: [hosting/azure/changes](hosting/azure/changes/).
- Cloudflare Worker, including MCP and Harness routing, authentication, and
  deployment: [hosting/cloudflare/changes](hosting/cloudflare/changes/).
- GitHub repository settings: [hosting/github/changes](hosting/github/changes/).

Follow [the shared convention](hosting/README.md#shared-operation-record-convention)
and [template](hosting/change-template.md). Prepare the intended
operation before changing an external system; record its outcome and verification
afterward, including failed changes and rollbacks. Cross-link affected components.
Commit the record with the related implementation, then record the actual deployed
revision if it was not known before publication. Exclude all secret values and raw
authentication or environment exports. Reconstructed history must state its evidence.

Use the same convention in future projects. The history requirement adds no extra
approval step to work the user has already authorized.

## CI/CD ownership

Reusable CI/CD workflows shared by repositories under `BrandoRiv` are owned by
the private `BrandoRiv/cicd` repository, with its fixed audit clone at
`C:\Workbench\cicd`. Update shared workflow behavior there, not by copying or
expanding logic in a caller repository. Allocate its leased clone with
`-Mode new-task -Repository cicd`, publish and verify the central change, then
update each caller to an exact commit SHA. Repository-specific checks may remain
local when they cannot be expressed safely by the shared workflow.

The public portfolio repository cannot call the private `brandoriv-dev/cicd`
reusable workflows. Its `.github/workflows/ci.yml` runs the project-specific
checks and existing `bun run deploy` command on the device runner. Keep generic
shared CI/CD behavior in `cicd`; do not change its visibility to bypass this
access boundary. The device runner operates in isolated, disposable Linux
containers; never mount workstation files or credentials into a job container.
The Windows workspace fixtures use a separate native runner with the host
account's access. Keep its owner actor, same repository, and owner PR author
guards; do not use that runner for arbitrary contributor code.
