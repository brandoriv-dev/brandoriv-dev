# Temporarily register Bstack with Workspace Manager

- Status: planned
- Verified: not checked
- Checked: the installed manifest does not contain `bstack`; GitHub access to `BrandoRiv/bstack` is available with administrator permission
- Not checked: source validation, local installation, and managed Bstack task allocation have not run yet
- When (UTC): 2026-09-25
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation, `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager\manifest.json`; repository registration `bstack`
- Previous: installed manifest from source revision `0c2aac7d`
- Deployed: planned temporary registration for `https://github.com/BrandoRiv/bstack.git`
- Operation: 2026-09-25-temporary-bstack-registration

## Intent

Register the private `BrandoRiv/bstack` repository long enough for Workspace
Manager to allocate an independently cloned, exclusively leased task branch for
the Bstack architecture refactor. Brandon explicitly described this registration
as temporary because workspace management is being removed from `brandoriv-dev`.

The registration does not change Bstack itself, repository permissions, cleanup
policy, or the scheduled task. Removing the manifest entry and reinstalling the
manager rolls back the workstation configuration after the replacement workspace
management location is available.

## Outcome

Pending.
