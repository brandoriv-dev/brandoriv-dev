# Temporarily register Bstack with Workspace Manager

- Status: applied
- Verified: checked
- Checked: all Workspace Manager source tests passed; change-history lint passed; the installed manifest resolves `bstack` to `https://github.com/BrandoRiv/bstack.git`; managed allocation `f254578542464822addd41179f70a07b` cloned the repository and pushed its exclusively leased task branch
- Not checked: nothing
- When (UTC): 2026-09-25T17:04:31.7841684Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation, `%LOCALAPPDATA%\BrandoRiv\WorkspaceManager\manifest.json`; repository registration `bstack`
- Previous: installed manifest from source revision `0c2aac7d41c60bddeedfe807b369f6ed7d6e38fc`
- Deployed: source revision `743d20eb9a4981dd70e1708a5912750eba7939b7`; installed repository registration `bstack` for `https://github.com/BrandoRiv/bstack.git`
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

The source and installed manifests now contain the temporary `bstack`
registration. Workspace Manager allocated task `f254578542464822addd41179f70a07b`
at `C:\Workbench\.tasks\f254578542464822addd41179f70a07b\bstack` and pushed
branch `agent/bstack/f254578542464822addd41179f70a07b`, proving the repository
can use the same independent-clone and exclusive-lease controls as the existing
manifest repositories.

The scheduled task configuration was not changed. The temporary registration
still needs to be removed from `brandoriv-dev` once Workspace Manager moves to
its replacement home.
