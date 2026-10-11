# Require all workspace and browser checks before main merges

- Status: applied
- Verified: partly
- Checked: Existing main ruleset 24043248 read; strict freshness and two required contexts observed. Hosted Windows fixture failed on PR 147 while its two required contexts passed and GitHub merged it. Ruleset PUT and independent GET matched all fields exactly, including five required contexts.
- Not checked: Next pull request acceptance under all five contexts; installation and installed canary remain pending.
- When (UTC): 2026-10-11T18:16:43Z
- Actor: Codex for Brandon
- Target: GitHub `brandoriv-dev/brandoriv-dev` main ruleset `24043248`
- Previous: Strict MCP smoke test and Policy and dashboard checks; existing review, deletion, non-fast-forward and bypass rules retained.
- Deployed: Active addition of Workspace manager Windows fixtures, Moss release consistency and Dashboard and Moss browser checks, each bound to GitHub Actions integration 15368.
- Source: PR 147; merge 3ca11ca7a65e18b5cd33701d83430d8a340761e7; failed Windows job 114537996642

## Intent

Require every existing verification job before a normal main merge. The Windows native-input fixture failed with a UTF-8 BOM; the deployment dependency guard skipped publication, but main protection only required two passing jobs. Preserve strict freshness, existing required contexts, review settings, branch protections and bypass actors. Add the three existing Actions contexts without introducing substitute checks.

## Outcome

Applied the update and fetched the ruleset again. All allowed request fields matched the readback exactly: name, target, enforcement, bypass actors, conditions and rules. The two existing required contexts retained their original fields; three additional existing contexts are bound to Actions integration 15368. Strict freshness, review settings, deletion protection, non-fast-forward protection and bypass actors are unchanged. Main now requires all five verification jobs. Installation and scheduled cleanup remain disabled until the repaired source passes hosted checks and the installed canary.
