# Require WorkspaceManager fixtures for development merges

- Status: planned
- Verified: not checked
- Checked: read-only GitHub API returned active ruleset 24660568, scoped only to refs/heads/development, with strict required checks MCP smoke test and Policy and dashboard checks; PR 137 head 302f86e46a695901f00bfb1663623e33e01654a7 passed all five CI contexts, including Workspace manager Windows fixtures
- Not checked: the additional required context has not been applied or read back; the owner will apply it only after the final PR 137 head passes all five checks and its workflow is available on development
- When (UTC): 2026-10-07
- Actor: Codex for Brandon Rivera
- Target: GitHub repository brandoriv-dev/brandoriv-dev, ruleset 24660568 (AI development guard), refs/heads/development only
- Previous: active strict guard requires MCP smoke test and Policy and dashboard checks, with pull-request, deletion and non-fast-forward rules
- Deployed: pending addition of Workspace manager Windows fixtures; existing checks and rules retained
- Source: https://github.com/brandoriv-dev/brandoriv-dev/pull/137

## Intent

Make fixture failures block future development merges that could compromise
WorkspaceManager retention, publication checks or diagnostics. Keep the existing
two required contexts and strict freshness; add the exact context
`Workspace manager Windows fixtures` only after its workflow runs successfully on
the final PR head and is present on development. This avoids requiring a check
that other development PRs cannot yet produce.

## Outcome

Preparation only. The observed development guard already requires
`MCP smoke test` and `Policy and dashboard checks` and enforces strict freshness.
The proposed third context is not yet required. The CI workflow produces it for
pull requests and pushes to both main and development. This operation does not
change main protection or the Cloudflare deployment source.

## Verification after application

Read back ruleset 24660568 and confirm its scope, active enforcement, strict
freshness and all three exact required context names. Record the final source
and merge revisions and verify the Windows context on the merged development
workflow. Retain the pull-request, deletion and non-fast-forward rules.
