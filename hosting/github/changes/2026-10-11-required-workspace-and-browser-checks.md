# Require all workspace and browser checks before main merges

- Status: planned
- Verified: not checked
- Checked: Existing main ruleset 24043248 read; strict freshness and two required contexts observed. Hosted Windows fixture failed on PR 147 while its two required contexts passed and GitHub merged it.
- Not checked: Ruleset update and readback; next pull request acceptance under all five contexts.
- When (UTC): 2026-10-11T18:12:00Z
- Actor: Codex for Brandon
- Target: GitHub brandoriv-dev/brandoriv-dev main ruleset 24043248
- Previous: Strict MCP smoke test and Policy and dashboard checks; existing review, deletion, non-fast-forward and bypass rules retained.
- Deployed: Pending addition of Workspace manager Windows fixtures, Moss release consistency and Dashboard and Moss browser checks, each bound to GitHub Actions integration 15368.
- Source: PR 147; merge 3ca11ca7a65e18b5cd33701d83430d8a340761e7; failed Windows job 114537996642

## Intent

Require every existing verification job before a normal main merge. The Windows native-input fixture failed with a UTF-8 BOM; the deployment dependency guard skipped publication, but main protection only required two passing jobs. Preserve strict freshness, existing required contexts, review settings, branch protections and bypass actors. Add the three existing Actions contexts without introducing substitute checks.

## Outcome

Pending external update and independent readback. Keep installation and scheduled cleanup disabled until the repaired source passes hosted checks and the installed canary.
