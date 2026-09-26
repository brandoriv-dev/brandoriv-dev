# Publish the verified neutral Moss catalog on the custom domain

- Status: applied
- Verified: partly
- Checked: Local build, integrity/live-source gate, nine integrity cases, seven desktop/mobile browser cases and 31 journal cases passed; PR and main CI passed. Wrangler confirmed the new version at 100 percent traffic. The existing signed-in production browser rendered 70 ready charts with zero chart errors and opened pagination Implementation source. Anonymous vendor.json requests still redirect to Microsoft sign-in with HTTP 302.
- Not checked: Cloudflare Workers Builds automatic publication was not exercised as deployment evidence; this promotion used the existing authenticated Wrangler CLI from verified main. The owner can inspect the provider build integration separately. Production asset digests were not independently downloaded through the owner session; the in-app browser blocked direct vendor.json navigation.
- When (UTC): 2026-09-26T16:50:06.364Z
- Actor: Codex for Brandon
- Target: Cloudflare Worker brandoriv-dev, account 3d873c2936146d4f557d0c2b469f69ac; brandoriv.dev/moss and the MCP dashboard runtime.
- Previous: Cloudflare version 2115a610-2555-47dd-bdc0-60eaab9dc878; catalog Moss cb75ab0ee010fa888a0882c258980120f898cc33.
- Deployed: Cloudflare version 9e5da214-c358-4269-9d9d-7f0dd6849333, serving 100 percent traffic.
- Operation: moss-neutral-catalog-promotion
- Source: Website PR 102, merge 911fa58dada8a619f4443f8190f8b3d096cee9d3, main CI run 36256785199; Moss 70b04b1d0e5297b243bd4090f371d661616bfa7e; shared CI/CD workflow d1fe964c9d84b234814ce67b111c5f7448f55ce8 from CI/CD PR 6.

## Intent

The Azure catalog already serves the verified neutral release, but the custom
domain serves an older independently vendored catalog. Promote the complete
verified asset tree, including charts, fonts, notices, and core modules, to both
website Moss surfaces. Retain reviewed source pins and reject stale or corrupt
bundles in CI and every website build before publication.

## Outcome

Published with `bun run deploy` from the clean website merge commit. The command
re-ran the verified build, uploaded the complete assets and deployed the Worker.
The custom domain now renders the new catalog, all 70 chart recipes, and the four
component documentation tabs. The saved owner MossTheme preference remains intact.
No secrets, Microsoft sign-in rules, routes, KV data, or Azure configuration change.
Future releases require vendoring the clean, published Moss commit and reviewing
the website promotion; this is a consistency gate, not automatic synchronization.

## Rollback

Restore the previously observed Worker version with Wrangler rollback if needed,
then revert the promotion and redeploy. A Worker version restores assets and code
together; it does not restore external secrets or stored data, which this operation
does not change.
