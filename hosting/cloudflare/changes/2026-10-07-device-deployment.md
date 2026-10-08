# Move portfolio build and deployment to Brandon's device

- Status: applied
- Verified: partly
- Checked: token summary showed exactly five requested permissions and one account/zone; GitHub production secret metadata confirmed creation at 2026-10-08T11:46:03Z; all five device checks and deployment passed in run 37772310408; Cloudflare active version 3b2332ed-55e0-4dc0-ace7-fb33c0aa5fa3 served 100% with the exact source message; homepage, Moss catalog and app returned HTTP 200, and the catalog vendor manifest pinned 88c4c9421c49143b50c780e877550e8a14b67b4d; Builds settings showed Connect after disconnection, while old build history and both API tokens remained visible and active
- Not checked: a future Git push was not made solely to test trigger suppression; an owner-authenticated production catalog render was not automated and Brandon can inspect it in his browser
- When (UTC): 2026-10-08T11:53:32Z
- Actor: Codex for Brandon Rivera
- Target: Cloudflare account `3d873c2936146d4f557d0c2b469f69ac`, Worker `brandoriv-dev`, domain `brandoriv.dev`, Workers Builds integration
- Previous: Cloudflare version `2954f833` (dashboard short ID) and Workers Builds link to `BrandoRiv/brandoriv-dev` with production branch `main`, non-production builds enabled, and the existing `brandoriv-dev build token`
- Deployed: Cloudflare deployment `8934910a-de5d-4d50-905c-2385979a07f0`, version `3b2332ed-55e0-4dc0-ace7-fb33c0aa5fa3`, source `340d3b35ecf0358009f40ac09fc2da1896f533d1`; Git-triggered Workers Builds connection retired
- Operation: 2026-10-07-device-runner
- Source: [PR 139](https://github.com/brandoriv-dev/brandoriv-dev/pull/139), [main run 37772310408](https://github.com/brandoriv-dev/brandoriv-dev/actions/runs/37772310408)

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

After Brandon's action-time confirmation, Cloudflare created the
`brandoriv-dev device deployment` user API token. Its account scope is only
Brandoriv.dev@gmail.com's Account, with Workers Scripts Edit, Workers KV Storage
Edit, and Account Settings Read. Its zone scope is only `brandoriv.dev`, with
Workers Routes Edit and Zone Read. No expiration was selected. The token value
was stored only as `CLOUDFLARE_API_TOKEN` in GitHub environment `production`
(`23732679712`), whose branch policy allows `main` only. Neither the token value
nor an authentication export was retained in the journal or evidence archive.

PR 139 merged at `340d3b35ecf0358009f40ac09fc2da1896f533d1` at
2026-10-08T11:46:41Z. All five main device checks passed, followed by the
production job on `DESKTOP-FFHBMGE` from 2026-10-08T11:49:47Z to
2026-10-08T11:50:35Z. The job preflight verified the existing `MCP_POLICIES`
namespace `06c32c63f1bd4f8494592661cedff41c`, then Wrangler deployed with
message `github:brandoriv-dev/brandoriv-dev@340d3b35ecf0358009f40ac09fc2da1896f533d1 run:37772310408/1`.
Its API readback verified deployment `8934910a-de5d-4d50-905c-2385979a07f0`
serves only version `3b2332ed-55e0-4dc0-ace7-fb33c0aa5fa3` at 100 percent.
An independent dashboard readback showed the same active version and message.

Only after that verification, the old Workers Builds Git repository connection
was disconnected through the Worker's Builds settings. The confirmation stated
that future pushes would no longer trigger automatic deployments. The settings
then showed Connect; the Deployments page retained earlier build history and
the new active version, and the profile still listed both the old build token
and the new scoped deployment token as active. Reconnecting the Git repository
is available if provider builds are needed again. No Worker route, KV data,
Azure origin, or bstack Worker setting was changed.

The Moss catalog and dashboard bundles now both reference
`88c4c9421c49143b50c780e877550e8a14b67b4d`. Its Azure production deployment
passed in [run 37727438968](https://github.com/brandoriv-dev/moss/actions/runs/37727438968),
and the public version endpoint independently returned that revision. The
existing vendor script read a clean checkout at that exact commit; nine
integrity and release-gate checks passed, and all 59 catalog and 35 dashboard
assets matched Azure production. The prepared portfolio update shipped in
Cloudflare run `37772310408` and was verified against the active Worker version.

The deployed refresh follows Moss's test readiness fix, which retained the existing
accessibility assertions and deadline and passed full checks on both branches.
The normal main release authenticated its package and verified the exact live
source before either portfolio branch read the clean checkout. The independent
public version readback matched at 2026-10-08T05:04:02Z.

## Rollback

Reconnect `BrandoRiv/brandoriv-dev` in this Worker's Builds settings with the
preserved old build token if provider builds are needed again, then restore the
previous branch and build commands. Revoke the new token only if this device
deployment path is deliberately retired and its GitHub secret has been removed.
Do not change the Worker's routes, KV data or Azure origins during this migration.
