# Run repository checks and deployment on Brandon's device

- Status: planned
- Verified: not checked
- Checked: GitHub authenticated as BrandoRiv with repository admin access; repository is public; no repository runner is registered; Cloudflare deployment credentials are absent locally and in repository Actions secrets
- Not checked: runner registration, workflow execution, Cloudflare deployment and removal of provider build automation
- When (UTC): 2026-10-07
- Actor: Codex for Brandon Rivera
- Target: GitHub repository brandoriv-dev/brandoriv-dev, Actions runner and workflows
- Previous: CI and manual answer study use ubuntu-24.04 GitHub-hosted runners; external fork approvals require first-time contributors only
- Deployed: planned device runner for DESKTOP-FFHBMGE

## Intent

Brandon requested using this device to avoid hosted Actions compute usage and
confirmed that it should also check and deploy main commits to Cloudflare.
Install a persistent runner, keep external pull-request code away from Windows
credentials, run existing checks on it, and deploy only passing main revisions.
Cloudflare continues serving the portfolio and its existing routes.

## Outcome

Pending installation and verification. No GitHub setting has been changed yet.

## Rollback

Restore the hosted runner selection and provider build integration, stop the
device runner, and unregister its exact runner ID after confirming no job runs.
