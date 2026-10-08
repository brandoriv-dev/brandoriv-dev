# GitHub

Current state of the GitHub settings this repository depends on. Repository
settings are not tracked as code; record out-of-band changes in `changes/` using
the [template](../change-template.md). Values no record establishes are marked
unknown.

- Repository: `brandoriv-dev/brandoriv-dev`, default branch `main`. Recorded as
  private on 2026-09-23, under the earlier owner `BrandoRiv`.
- Actions: `.github/workflows/ci.yml` runs five verification jobs and deploys
  passing owner-authored `main` revisions to Cloudflare from Brandon's device;
  `answer-study.yml` runs manually. Reusable CI/CD belongs to `brandoriv-dev/cicd`.
- Merge settings (2026-09-23): `delete_branch_on_merge: true`; `allow_auto_merge`
  stayed `false` although the update was accepted. Branch protection and rulesets
  returned 403 on that date, so CI checks were advisory
  ([record](changes/2026-09-23-repository-merge-settings.md)).
- Production environment `23732679712` allows `main` only and contains the
  `CLOUDFLARE_API_TOKEN` secret. Other environment variables: unknown.
- Development guard (2026-10-07): active ruleset `24660568` requires
  `MCP smoke test`, `Policy and dashboard checks` and
  `Workspace manager Windows fixtures` with strict freshness, plus pull-request,
  deletion and non-fast-forward rules. The Windows context is bound to GitHub
  Actions integration `15368`; main guard `24043248` is unchanged
  ([record](changes/2026-10-07-development-workspace-fixture-guard.md)).

## Records

<!-- records:begin -->
- [Run the owner-authored Windows fixtures on Brandon's device](changes/2026-10-07-native-windows-device-runner.md)
- [Run repository checks and deployment on Brandon's device](changes/2026-10-07-device-runner.md)
- [Require WorkspaceManager fixtures for development merges](changes/2026-10-07-development-workspace-fixture-guard.md)
- [Enable branch deletion on merge across the workspace repositories](changes/2026-09-23-repository-merge-settings.md)
<!-- records:end -->
