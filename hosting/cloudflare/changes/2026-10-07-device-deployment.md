# Move portfolio build and deployment to Brandon's device

- Status: planned
- Verified: not checked
- Checked: wrangler.jsonc identifies Worker brandoriv-dev and account 3d873c2936146d4f557d0c2b469f69ac; the existing deploy command builds locally and publishes with Wrangler; no local Cloudflare credential or repository deployment secret was found
- Not checked: Cloudflare sign-in, scoped deployment credential, current provider build configuration, device deployment and production verification
- When (UTC): 2026-10-07
- Actor: Codex for Brandon Rivera
- Target: Cloudflare account `3d873c2936146d4f557d0c2b469f69ac`, Worker `brandoriv-dev`, domain `brandoriv.dev`, Workers Builds integration
- Previous: provider builds from main are documented but current integration is unverified
- Deployed: planned device builds and Wrangler deployment after all main checks pass
- Operation: 2026-10-07-device-runner

## Intent

Brandon confirmed that the device should run checks and deploy to Cloudflare.
The GitHub production environment will hold the deployment credential and allow
main only. After a verified device deployment, disable provider builds to avoid
paying for duplicate build compute. Existing hosting and routes remain managed
by wrangler.jsonc.

## Outcome

Pending Cloudflare sign-in and workflow publication. The browser is at the
Cloudflare sign-in page; no Cloudflare configuration has changed.

## Rollback

Re-enable the recorded previous Workers Builds configuration and restore the
previous workflow. Revoke the new credential if device deployment is abandoned.
Do not change the Worker's routes, KV data or Azure origins during this migration.
