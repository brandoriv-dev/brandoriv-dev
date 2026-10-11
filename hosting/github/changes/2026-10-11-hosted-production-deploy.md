# Run the guarded production deployment on a hosted Linux runner

- Status: planned
- Verified: not checked
- Checked: GitHub Actions runner inventory for `brandoriv-dev/brandoriv-dev` returned zero registrations; the `production` environment allows only branch `main` and lists the `CLOUDFLARE_API_TOKEN` secret name (no value read); source review found the deploy job's `runs-on` label was the only dependency on that private device runner; the job uses Bash, Git, Node, Bun and Wrangler available through its existing pinned setup; actor/main/ref guard, environment, current-main check, KV binding check, secret references, deployment metadata verification and concurrency lock remain unchanged
- Not checked: merged workflow execution and Cloudflare deployment; whether the `CLOUDFLARE_API_TOKEN` value is valid; these require normal protected publication and a main-branch run
- When (UTC): 2026-10-11T15:09:52Z
- Actor: Codex for Brandon Rivera
- Target: GitHub repository `brandoriv-dev/brandoriv-dev`, `.github/workflows/ci.yml` job `deploy`, Cloudflare Worker `brandoriv-dev` production release
- Previous: deploy job required `[self-hosted, Linux, X64, brandoriv-dev]`; the GitHub Actions runner API returned zero registered repository runners
- Deployed: no external state changed; local candidate selects `ubuntu-24.04` for the existing guarded deployment job
- Operation: portfolio-hosted-deploy-runner

## Intent

The repository has no registered runner matching the production job's required
labels, so a passing main workflow cannot reach its deployment step. The job
already installs Bun and dependencies and performs its build, source revision,
Cloudflare policy binding and active deployment checks in Bash/Node. Move only
the deployment job to GitHub-hosted Ubuntu. Keep its existing owner actor, main
branch, production environment, concurrency, credential scope, current-main and
Cloudflare deployment checks intact.

## Outcome

This is a prepared source change only. No workflow run, credential, environment,
Cloudflare setting or deployment was changed. The `production` environment's
branch policy is `main`; its secret-name list includes `CLOUDFLARE_API_TOKEN`.
The value was not read. After protected publication, verify
that a main run reaches this job on `ubuntu-24.04`, passes the existing binding
and current-source gates, deploys the checked SHA and verifies the active
Cloudflare version. If the environment credentials are unavailable to that
runner, the job will fail before deployment; restore the prior runner selector
only after a suitable owned runner is registered and healthy.

## Rollback

Revert the runner-selector line through the normal protected source workflow.
The job will again wait for an online runner with the exact `brandoriv-dev`
labels. Keep the production environment, main-only condition, source and binding
checks, and concurrency lock unchanged.
