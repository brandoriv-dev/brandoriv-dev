# Enable branch deletion on merge across the workspace repositories

- Status: partial
- Verified: partly
- Checked: all four repositories re-read after the change and report `delete_branch_on_merge: true`; PRs `terrarium#16` and `brandoriv-dev#77` merged at 13:21:41Z and 13:21:46Z and both source branches were deleted automatically; 51 already-merged branches deleted and the 12 diverged ones re-listed and still present
- Not checked: whether `allow_auto_merge` can be enabled by any other means on this plan — the PATCH was accepted without error and the value stayed false, and the cause was inferred rather than confirmed against GitHub documentation
- When (UTC): 2026-09-23T13:22:00Z
- Actor: Claude Opus 5 for Brandon Rivera
- Target: GitHub repository settings on `BrandoRiv/terrarium`, `BrandoRiv/brandoriv-dev`, `BrandoRiv/slow-and-steady`, `BrandoRiv/moss` — `delete_branch_on_merge` and `allow_auto_merge`
- Previous: `delete_branch_on_merge: false`, `allow_auto_merge: false` on all four
- Deployed: `delete_branch_on_merge: true` on all four; `allow_auto_merge` unchanged at `false`
- Operation: 2026-09-23-cicd-agent-hygiene

## Intent

Merged branches are never deleted, so `brandoriv-dev` alone carries 24 merged
branches still on the remote. An agent starting cold reads all of them on every
`git branch -a`, and none of them mean anything. `allow_auto_merge` is enabled at
the same time because without it an agent has to poll a run to completion rather
than queueing the merge and stopping.

Both are plain repository settings and are available on the free plan. Branch
protection and rulesets are not: both endpoints return 403 on these private
repositories, so there are no required status checks anywhere and CI remains
advisory. That limitation is the reason this record exists rather than a rule.

The accumulated merged branches will be deleted in the same operation. Only
branches already merged into `origin/main` are in scope; unmerged branches, and any
branch another agent may still be working from, are left alone.

## Outcome

`delete_branch_on_merge` is now true on all four repositories and works: both PRs
merged during this operation had their source branches removed without being asked.

`allow_auto_merge` did not take. `PATCH /repos/{owner}/{repo}` returned success and
the field read back as `false` on every attempt, including a retry sending only
that field. No error was returned, so this is a silent no-op rather than a refusal.
The likely cause is that auto-merge depends on protected branches, which this plan
does not provide — consistent with branch protection and rulesets returning 403 on
the same repositories. This is recorded as inference, not as a confirmed cause.

51 fully merged branches were deleted across the four repositories. Merge status
was determined per branch with `compare/main...<branch>`, deleting only `behind` or
`identical`. 12 branches reported `diverged` and were left in place, among them
`brandoriv-dev/rescue-stash-2026-09-23`, which carries another agent's work.

## Rollback

Set `delete_branch_on_merge` back to `false` per repository. Deleted branches are
recoverable from `main`'s history, since every one was fully merged; the 12
diverged branches were never touched. Rollback has not been performed and is not
expected to be needed.

## Drift and follow-up

`allow_auto_merge` remains off and the agent workflow it was meant to enable —
queue the merge, stop polling — is not available. Revisit if these repositories
ever move to a plan with protected branches, which would also restore required
status checks and make CI blocking rather than advisory.

Two pre-existing CI failures were observed during this operation and are not
introduced by it. `mcp/smoke.mjs` fails on `browser document returns the dashboard
shell`, which the four `main` runs before this operation also failed. The manual
`answer-study.yml` workflow continues to emit a jobless startup failure on pushes
to `main`, a follow-up already recorded on 2026-09-23. The Cloudflare publication
and the `Policy and dashboard checks` job, which carries the new journal lint, both
succeeded on merge `e545b7e`.
