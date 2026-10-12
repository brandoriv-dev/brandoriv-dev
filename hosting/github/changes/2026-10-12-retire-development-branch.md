# Retire the protected development branch

- Status: applied
- Verified: partly
- Checked: The coordinator's post-operation readbacks (receipt line for `brandoriv-dev/brandoriv-dev`, kept outside Git) showed the `archive/development-2026-10-12` tag present and verified at `c7cb8b07f0aad26f10f4a7b19e4f510bbfe8c034`, ruleset `24660568` absent, the `development` branch absent, and the default-branch ruleset "AI mainline guard" still active
- Not checked: This record's author did not repeat the GitHub readbacks. Nothing compared the full field-by-field definition of the main ruleset before and after, and no workflow run after the retirement has been observed
- When (UTC): 2026-10-12T22:42:26Z
- Actor: Claude Code for Brandon Rivera
- Target: GitHub `brandoriv-dev/brandoriv-dev`: ruleset `24660568` (AI development guard, `refs/heads/development` only), branch `refs/heads/development`, tag `refs/tags/archive/development-2026-10-12`
- Previous: Branch `development` at `c7cb8b07f0aad26f10f4a7b19e4f510bbfe8c034`, protected by ruleset `24660568`; the ruleset required `MCP smoke test`, `Policy and dashboard checks` and `Workspace manager Windows fixtures` with strict freshness, plus pull-request, deletion and non-fast-forward rules, per [the 2026-10-07 record](2026-10-07-development-workspace-fixture-guard.md).
- Deployed: Lightweight tag `archive/development-2026-10-12` at `c7cb8b07f0aad26f10f4a7b19e4f510bbfe8c034`; ruleset `24660568` deleted; branch `development` deleted
- Operation: retire-development-branches-2026-10-12
- Source: coordinator third-pass receipt 2026-10-12T22:42:26Z (outside Git)

## Intent

Brandon said the protected `development` branches "were originally created to try and reduce build cost" and delegated the decision. The coordinator retired the branch in all six repositories that had one, so `main` is the only integration branch. Observed before the change: a protected `development` branch with its own ruleset. Intended after the change: no `development` branch or guard, the old tip kept reachable through a tag, and the default-branch guard untouched.

## Outcome

The `development` tip `c7cb8b07f0aad26f10f4a7b19e4f510bbfe8c034` was preserved as lightweight tag `archive/development-2026-10-12` and the tag was verified. Ruleset `24660568` was then deleted and the `development` branch was deleted. The ruleset targeted only `refs/heads/development` and had no bypass actors. The "AI mainline guard" ruleset on the default branch was not modified and was read back as active.

## What is preserved and what is not

- Preserved: every commit reachable from the old tip, through the tag. Development-only commits that never reached `main` (PRs 140 to 142, 2026-10-07 to 2026-10-08: trusted device-runner routing for development checks, the vendored live Moss release refresh, and the verified device deployment record) are now reachable only through the tag.
- Not preserved: the ruleset definition (its required status contexts, pull-request, deletion and non-fast-forward rules) and the branch's protection state. Only the prose in earlier records describes them.
- Earlier records that describe `development` as active are historical and were not rewritten.

## Main protection

Unchanged. The default-branch ruleset "AI mainline guard" remained active throughout and was not edited by this operation.

## Rollback

Recreate the branch from the tag, then re-create a ruleset for it:

1. `git push origin refs/tags/archive/development-2026-10-12:refs/heads/development` creates `development` at `c7cb8b07f0aad26f10f4a7b19e4f510bbfe8c034`.
2. Create a ruleset named "AI development guard" that targets only `refs/heads/development` with no bypass actors. The tag carries the commits, not the ruleset; the old rules must be rebuilt by hand from earlier records.
3. Restore any removed `development` branch triggers in the workflows before relying on it.

The new ruleset receives a new numeric id, so `24660568` cannot be reused.
