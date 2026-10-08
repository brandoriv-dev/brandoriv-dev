# Run repository checks and deployment on Brandon's device

- Status: partial
- Verified: partly
- Checked: actual portfolio run 37713859900 passed all five checks at source 4e307eac65a687dd3f52df88ae7f571caaa86a1b on device Linux/Windows runners; fresh registrations and cleanup verified; native scheduled preflight passed; external forks require approval; production environment 23732679712 and main-only policy 62310202 verified
- Not checked: final contributor runner selection and Cloudflare binding preflight will be checked in the next source run; Cloudflare deployment and provider build retirement await credential approval
- When (UTC): 2026-10-08T01:07:25Z
- Actor: Codex for Brandon Rivera
- Target: GitHub repository `brandoriv-dev/brandoriv-dev`, Actions runner and workflows, fork approval policy, and deployment environment `production` restricted to `main`
- Previous: CI and manual answer study use ubuntu-24.04 GitHub-hosted runners; external fork approvals require first-time contributors only
- Deployed: Linux repository runner 21; persistent task `BrandoRiv brandoriv-dev Device Runner`; guarded workflow prepared locally

## Intent

Brandon requested using this device to avoid hosted Actions compute usage and
confirmed that it should also check and deploy main commits to Cloudflare.
Install a persistent runner, keep external pull-request code away from Windows
credentials, run existing checks on it, and deploy only passing main revisions.
Cloudflare continues serving the portfolio and its existing routes.

Before registering the runner, require approval for all external fork
contributors. Create the production environment with a branch policy accepting
only main; deployment credentials will belong to that environment.

## Outcome

Fork approval and production branch policies were applied before registration.
Owner checks select the device. Other public contributors keep their required
checks on standard GitHub-hosted runners, which are free for public repositories;
skipping those jobs would incorrectly satisfy required checks without execution.
The native Windows selector additionally requires the owner as PR author.
The isolated Linux repository runner is online, and its native Windows logon
supervisor is now persistent. Runtime files use durable Documents paths because
Codex's MSIX AppData virtualization prevented native scheduled tasks from seeing
the original installation. No protection was disabled.

The related private organization work is recorded in
`brandoriv-dev/cicd/hosting/github/changes/2026-10-07-device-private-runner.md`;
central migration PR 21 passed actual device validation and the existing review
policy before merging at `143410916f3fca140e160ef8ff8981ce151d23c6`.

Portfolio PR 139 passed all five device check jobs in run 37713859900. The
subsequent source update restores free standard hosted execution for other
public contributors, replacing job skips with runner selection. Deployment
remains main-only and owner-triggered, after all five checks pass.

This branch integrates already verified development fixes for Moss release
consistency and the Windows fixture gate. A separate native Windows repository
runner serves the trusted owner fixture job; see
[its scope and host-account boundary](2026-10-07-native-windows-device-runner.md).

## Rollback

Restore the hosted runner selection and provider build integration, stop the
device runner, and unregister its exact runner ID after confirming no job runs.
