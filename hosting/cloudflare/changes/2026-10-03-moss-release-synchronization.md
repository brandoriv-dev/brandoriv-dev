# Synchronize the website with the deployed Moss revision

- Status: applied
- Verified: partly
- Checked: Moss release workflow succeeded and its live version equals d2781e19c25458776efc0a6b3fd1fd0f41a71cbf; all 35 vendored runtime hashes remain unchanged; website catalog integrity/live-release/dashboard tests, full build and all four PR CI jobs passed. Wrangler published four changed assets; public catalog manifest reports the same Moss SHA, home returns 200 and retired MCP returns 410.
- Not checked: real owner browser sign-in and authenticated dashboard interaction. Catalog content is unchanged; this operation synchronizes provenance and versioned asset paths.
- When (UTC): 2026-10-04T01:46:33Z
- Actor: Codex for Brandon Rivera
- Target: Cloudflare Worker `brandoriv-dev`, brandoriv.dev/moss and /mcp asset bundles; Azure source `func-moss-7b5a92e0b4c1` in rg-moss.
- Previous: Worker version 6a2c4b99-6f37-4b28-aff5-b55a62ef2b56; vendored Moss source 76961ec97fba35c7ad8438ec2c87a4cd8d15266f.
- Deployed: Worker version 3c916fd6-6bd9-4cf5-a6e1-ea0b598e97d2; Moss source d2781e19c25458776efc0a6b3fd1fd0f41a71cbf.
- Source: website merged PR #125, 73d6875e66d3ca93eb62728e2e3c8b69ea38559f; Moss deployment run 37168168879.

## Intent

Brandon authorized merging/deploying the audit changes. The explicit Moss deployment changed its published SHA, so the website's existing exact-live-release check required updating both vendored pins. The synchronization and validation were prepared in PR #125 before publication. This receipt records the observed outcome afterward.

## Outcome

Merged #125 after all checks passed and published the matching tested build with `wrangler deploy --strict --keep-vars`. The new catalog and dashboard manifests retain all prior file hashes. Prior versioned bundles remain available; no generated files required removal. Existing secrets, variables, retired MCP and Azure Harness/Ledger proxy targets were preserved. Live catalog provenance matches Azure's exact merged SHA.

## Rollback

Restore the Previous Worker version only together with a compatible Moss release/pin: the prior website manifest intentionally fails the live-release check while Azure still reports the new SHA. Persistent provider state is not restored by code rollback. Prefer forward repair of a pin issue and preserve all stored state.
