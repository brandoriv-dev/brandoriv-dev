# Collaboration and external operations

Other agents may be working in this repository. Inspect Git status and remote
changes first. Use an isolated worktree, preserve all existing stashes, and never
delete or overwrite files you did not author to clear your own path. Untracked
files are not disposable. Stage only your task's files and pull/compare before push.

Record changes outside Git in the component's operation history:

- Azure and Entra: [Azure/changes](Azure/changes/).
- Terrarium routing, authentication, and deployment: [terrarium/changes](terrarium/changes/).
- MCP configuration, authentication, and deployment: [mcp/changes](mcp/changes/).

Follow [the shared convention and template](Azure/README.md). Prepare the intended
operation before changing an external system; record its outcome and verification
afterward, including failed changes and rollbacks. Cross-link affected components.
Commit the record with the related implementation, then record the actual deployed
revision if it was not known before publication. Exclude all secret values and raw
authentication or environment exports. Reconstructed history must state its evidence.

Use the same convention in future projects. The history requirement adds no extra
approval step to work the user has already authorized.
