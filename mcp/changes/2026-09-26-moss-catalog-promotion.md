# Publish the verified neutral Moss catalog on the custom domain

- Status: planned
- Verified: not checked
- Checked: Local build, integrity and live-source checks, nine integrity regression cases, and seven desktop/mobile browser checks passed.
- Not checked: Production publication and owner-authenticated production rendering await deployment; the deploying agent will check publication and the available owner browser session.
- When (UTC): 2026-09-26
- Actor: Codex for Brandon
- Target: Cloudflare Worker brandoriv-dev, account 3d873c2936146d4f557d0c2b469f69ac; brandoriv.dev/moss and the MCP dashboard runtime.
- Previous: Cloudflare version 2115a610-2555-47dd-bdc0-60eaab9dc878; catalog Moss cb75ab0ee010fa888a0882c258980120f898cc33.
- Deployed: Not yet published.
- Operation: moss-neutral-catalog-promotion
- Source: Moss 70b04b1d0e5297b243bd4090f371d661616bfa7e; shared CI/CD workflow d1fe964c9d84b234814ce67b111c5f7448f55ce8.

## Intent

The Azure catalog already serves the verified neutral release, but the custom
domain serves an older independently vendored catalog. Promote the complete
verified asset tree, including charts, fonts, notices, and core modules, to both
website Moss surfaces. Retain reviewed source pins and reject stale or corrupt
bundles in CI and every website build before publication.

## Outcome

Implementation and local checks are complete. Publication has not been attempted.
No secrets, Microsoft sign-in rules, routes, KV data, or Azure configuration change.
Future releases require vendoring the clean, published Moss commit and reviewing
the website promotion; this is a consistency gate, not automatic synchronization.

## Rollback

Restore the previously observed Worker version with Wrangler rollback if needed,
then revert the promotion and redeploy. A Worker version restores assets and code
together; it does not restore external secrets or stored data, which this operation
does not change.
