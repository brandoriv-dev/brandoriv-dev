# Move portfolio build and deployment to Brandon's device

- Status: planned
- Verified: not checked
- Checked: signed-in account and existing Workers verified; current Workers Builds link still names BrandoRiv/brandoriv-dev; scoped deployment token prepared for review; GitHub production environment exists and permits main only
- Not checked: token creation and secret storage await action-time approval; device deployment and production verification; provider build retirement
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

Pin the already recorded MCP_POLICIES namespace in wrangler.jsonc so the new
deployment path preserves archived policy history. Before publishing, verify
the existing production binding still uses that recorded namespace; fail if
it has drifted. Tag each deployment with its
GitHub source and run, then verify Cloudflare's newest deployment record serves
one version at 100 percent with that exact message before reporting success.

## Outcome

Cloudflare is signed in. A token draft permits Workers Scripts and Workers KV
editing in the existing account, Account Settings reading, and Workers Routes
editing plus Zone reading only for brandoriv.dev. The browser confirmation
policy requires action-time approval before creating this new credential and
storing it in the GitHub production environment. No token has been created.

The existing provider build link still names the previous BrandoRiv repository
owner. Keep that integration until a device deployment passes, then retire
duplicate provider builds and record the final production revision.

## Rollback

Re-enable the recorded previous Workers Builds configuration and restore the
previous workflow. Revoke the new credential if device deployment is abandoned.
Do not change the Worker's routes, KV data or Azure origins during this migration.
