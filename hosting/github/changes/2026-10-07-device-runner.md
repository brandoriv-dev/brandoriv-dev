# Run repository checks and deployment on Brandon's device

- Status: applied
- Verified: partly
- Checked: all five main jobs passed on the device in run 37772310408 at source 340d3b35ecf0358009f40ac09fc2da1896f533d1; production environment 23732679712 allows main only and held CLOUDFLARE_API_TOKEN from 2026-10-08T11:46:03Z; the production job verified the existing KV binding and Cloudflare active version at 100%; fresh registrations and cleanup and native scheduled preflight passed; external forks require approval
- Not checked: the public-contributor hosted fallback was inspected in workflow selection but no external contributor run was started; Brandon or a future external contributor can exercise that path
- When (UTC): 2026-10-08T11:53:32Z
- Actor: Codex for Brandon Rivera
- Target: GitHub repository `brandoriv-dev/brandoriv-dev`, Actions runner and workflows, fork approval policy, and deployment environment `production` restricted to `main`
- Previous: CI and manual answer study use ubuntu-24.04 GitHub-hosted runners; external fork approvals require first-time contributors only
- Deployed: Linux repository runner 21, persistent task `BrandoRiv brandoriv-dev Device Runner`, guarded main workflow at `340d3b35ecf0358009f40ac09fc2da1896f533d1`, GitHub environment `production` secret `CLOUDFLARE_API_TOKEN`

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

Portfolio PR 139 passed all five device check jobs in run 37716247889 at
`fe3175a3a645476d3313f23a1073d9f7b6531bc4`. The checked source restores free
standard hosted execution for other public contributors, replacing job skips
with runner selection. This run exercised the owner's device path; contributor
paths were inspected in the workflow but no external contributor run was
started. Deployment remains main-only and owner-triggered, after all five
checks pass. Deployment was correctly skipped on this pull request.

After action-time confirmation, the scoped Cloudflare token was stored as the
`CLOUDFLARE_API_TOKEN` environment secret. GitHub reports its creation at
2026-10-08T11:46:03Z. The final PR head
`afa825abfe9c308031b426e45b77ca39771764e5` passed all five checks in
[run 37730593049](https://github.com/brandoriv-dev/brandoriv-dev/actions/runs/37730593049),
then merged normally as `340d3b35ecf0358009f40ac09fc2da1896f533d1`.
Its automatic [main run 37772310408](https://github.com/brandoriv-dev/brandoriv-dev/actions/runs/37772310408)
passed all five device checks and the main-only production job. The job's
current-main guard, KV namespace preflight, Cloudflare version readback, and
public homepage check all passed. The exact deployment and Workers Builds
retirement are recorded in the linked
[Cloudflare journal](../../cloudflare/changes/2026-10-07-device-deployment.md).

This branch integrates already verified development fixes for Moss release
consistency and the Windows fixture gate. A separate native Windows repository
runner serves the trusted owner fixture job; see
[its scope and host-account boundary](2026-10-07-native-windows-device-runner.md).

## Rollback

Restore the hosted runner selection and provider build integration, stop the
device runner, and unregister its exact runner ID after confirming no job runs.
