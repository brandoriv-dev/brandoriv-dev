# Point the workspace manager at the brandoriv-dev owner

- Status: planned
- Verified: not checked
- Checked: 40 manager unit checks and 30 integration checks passed in Windows PowerShell 5.1, including two new ones (a task recorded under an unlisted old remote is refused; one under a listed legacy remote resumes). The source manager's `-Mode health` reports healthy against the real Workbench clones, while the installed manager reports unhealthy because their origins already use `brandoriv-dev`. All seven new remotes resolve with `git ls-remote`.
- Not checked: the installed manager, because the source has not merged yet; the legacy test suite, which pushes and deletes fixtures.
- When (UTC): 2026-10-06
- Actor: Claude Code for Brandon Rivera
- Target: Brandon workstation, `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager\workspace-manager.ps1` and `manifest.json`
- Previous: manifest remotes `https://github.com/BrandoRiv/<repo>.git`; installed health unhealthy (canonical remote mismatch for every repository)
- Deployed: pending
- Operation: 2026-10-06-manager-owner-rename

## Intent

The repositories moved from the `BrandoRiv` owner to `brandoriv-dev`. GitHub redirects the old URLs, but new task clones record the old remote, so `gh pr create` in a lease cannot resolve the head repository without `--head`, and the manager's own health check flags every canonical clone. Brandon approved the fix on 2026-10-06.

The manifest now names the `brandoriv-dev` remotes and keeps each old address in an optional `legacyRemotes` list. The task-ownership check accepts any listed remote, so leases recorded before the change still resume and complete; new tasks always clone from `remote`. Legacy entries pass the same URL validation as `remote`.

## Outcome

Pending merge and `-Mode install` (which copies the script and manifest only; the scheduler is unchanged).

## Rollback

Reinstall from the previous source revision with `-Mode install`. Leases created after the change record the `brandoriv-dev` remote, so the previous manager would refuse them until they are completed.
