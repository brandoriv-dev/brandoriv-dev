# GitHub

Current state of the GitHub settings this repository depends on. Repository
settings are not tracked as code; record out-of-band changes in `changes/` using
the [template](../change-template.md). Values no record establishes are marked
unknown.

- Repository: `brandoriv-dev/brandoriv-dev`, default branch `main`. Recorded as
  private on 2026-09-23, under the earlier owner `BrandoRiv`.
- Actions: `.github/workflows/ci.yml` is the verification gate and does not deploy;
  `answer-study.yml` runs manually. Reusable CI/CD belongs to `brandoriv-dev/cicd`.
- Merge settings (2026-09-23): `delete_branch_on_merge: true`; `allow_auto_merge`
  stayed `false` although the update was accepted. Branch protection and rulesets
  returned 403 on that date, so CI checks were advisory
  ([record](changes/2026-09-23-repository-merge-settings.md)).
- Environments, variables and current visibility: unknown.

## Records

<!-- records:begin -->
- [Enable branch deletion on merge across the workspace repositories](changes/2026-09-23-repository-merge-settings.md)
<!-- records:end -->
