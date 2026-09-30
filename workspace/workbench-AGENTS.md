# Workbench instructions

- Work inside one named project. Read `PROJECTS.md` only when the target is unclear; do not recursively inventory Workbench.
- The fixed Git repositories in this folder are audit-only. Before changing one, read its `AGENTS.md` and use its WorkspaceManager command to obtain a leased clone.
- Do not edit `.tasks` directly. Search it, dated `ai-artifacts`, dependencies, Git internals, and generated test/build output only when the task specifically requires them.
- Put disposable generated evidence in `ai-artifacts/YYYY-MM-DD/<task-slug>/`. Use `scripts/new-ai-artifact.ps1` so the task has a manifest.
- Keep durable source, decisions, and operating history in the owning repository. Never store secrets or raw authentication exports in Workbench artifacts.
- Repository-local `AGENTS.md` files govern project work. Preserve user files and avoid broad cleanup, reset, or overwrite operations.

## Agent operating contract

Every agent task must end in one recorded handoff state:

- `no-change`: investigation only, with no workspace changes.
- `pr-open`: owned changes committed, pushed, and linked in a PR.
- `local-committed`: owned changes committed in the leased clone; report its path,
  branch, revision, verification, and pending publication when push is not authorized.
- `blocked-clean`: no useful progress is possible, and owned scratch changes are committed, stashed, or removed.

Before finishing, run `scripts/workbench-agent-contract.ps1 -RepositoryPath <owned-clone>`
from Workbench. Use `-Root C:\Workbench` only for a requested global audit. Report
owned dirty state, unpushed work, open PRs, and verification gaps. Preserve other
agents' work. Allocation is local-only; push, merge, deploy, and deletion require
Brandon's explicit authorization in the current request. An older repository
instruction mentioning a pushed allocation does not authorize publication.

For repository work, prefer one branch and one PR per user objective. Resume the
exact existing TaskId when safe rather than allocating duplicates. If a matching
open PR exists, reuse it when publication is authorized. Merge only with explicit
authorization and after required checks pass. Report stale or superseded PRs for
an explicit closure decision.
