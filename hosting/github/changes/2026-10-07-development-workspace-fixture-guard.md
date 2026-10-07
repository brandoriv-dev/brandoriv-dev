# Require WorkspaceManager fixtures for development merges

- Status: applied
- Verified: partly
- Checked: root applied ruleset 24660568 and read back effective development rules with all three exact required contexts, strict freshness, GitHub Actions integration 15368 for Workspace manager Windows fixtures and no bypass actors; PR 137 head fa9ffdc26217bf23157da2cf90c703241d8c8632 passed all five contexts in run 37646493641; main ruleset 24043248 still requires only the original two strict contexts
- Not checked: this outcome-record commit still needs exact-head CI; the Windows fixture context on merged development awaits PR 137 merge, which the owner will verify without bypass
- When (UTC): 2026-10-07T15:46:40.666Z
- Actor: Codex for Brandon Rivera
- Target: GitHub repository brandoriv-dev/brandoriv-dev, ruleset 24660568 (AI development guard), refs/heads/development only
- Previous: active strict guard requires MCP smoke test and Policy and dashboard checks, with pull-request, deletion and non-fast-forward rules
- Deployed: active strict development guard additionally requires Workspace manager Windows fixtures from GitHub Actions integration 15368; existing contexts and rules retained
- Source: https://github.com/brandoriv-dev/brandoriv-dev/pull/137

## Intent

Make fixture failures block future development merges that could compromise
WorkspaceManager retention, publication checks or diagnostics. Keep the existing
two required contexts and strict freshness; add the exact context
`Workspace manager Windows fixtures` after successful PR-head execution so the
final implementation merge also requires it. Verify execution on merged
development afterward; no main promotion or production publication is included.

## Outcome

After all five checks passed on `fa9ffdc`, root added the third context before
merging PR 137. Effective-rule readback preserved `MCP smoke test`,
`Policy and dashboard checks`, strict freshness, pull-request, deletion and
non-fast-forward rules; bypass actors remain empty. The new Windows context is
bound to GitHub Actions integration `15368`. The CI workflow produces it for
pull requests and pushes to both main and development. Main protection and the
Cloudflare deployment source are unchanged.

The timestamp comes from the applied ruleset's `updated_at`; external sanitized
applied/readback receipts were saved at 15:46:40.907Z and 15:46:41.312Z in the
2026-10-07 branch-audit artifact directory. The source, fixture bytes and
deployment configuration did not change in this outcome-record commit.

## Remaining verification

Require all five checks on the outcome-record head, record the merge revision,
and verify the Windows context on the merged development workflow. The ruleset
and effective-rule readbacks already confirm active enforcement, development
scope, strict freshness and all three exact required context names.
