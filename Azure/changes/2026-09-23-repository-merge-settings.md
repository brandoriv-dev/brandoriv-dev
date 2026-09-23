# Enable branch deletion on merge across the workspace repositories

- Status: planned
- Verified: not checked
- Checked: nothing yet; this record is written before the change
- Not checked: everything — the settings have not been changed at the time of writing
- When (UTC): 2026-09-23
- Actor: Claude Opus 5 for Brandon Rivera
- Target: GitHub repository settings on `BrandoRiv/terrarium`, `BrandoRiv/brandoriv-dev`, `BrandoRiv/slow-and-steady`, `BrandoRiv/moss` — `delete_branch_on_merge` and `allow_auto_merge`
- Previous: `delete_branch_on_merge: false`, `allow_auto_merge: false` on all four
- Deployed: pending
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

Pending.
