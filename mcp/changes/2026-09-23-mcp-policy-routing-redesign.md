# Publish the MCP policy-routing redesign

- Status: applied
- Verified: partly
- Checked: PR checks, post-merge CI, merged revision, and live production health
- Not checked: Cloudflare's production build/version identifier and a post-merge authenticated tool call; GitHub exposed only the successful PR build identifier
- When (UTC): 2026-09-23T22:28:06Z
- Actor: Cursor agent for Brandon Rivera
- Target: GitHub `BrandoRiv/brandoriv-dev` `main`; Cloudflare Worker `brandoriv-dev`; `/mcp`, `/mcp/health`, dashboard policy data, tools, resources, and `grill-me` prompt
- Previous: live MCP service version `1.11.1`, observed from `https://brandoriv.dev/mcp/health` on 2026-09-23
- Deployed: merge commit `65d80724828591c4d45d1113312e3b691ecfb676`; live service version `1.13.0`
- Source: PR `https://github.com/BrandoRiv/brandoriv-dev/pull/81`

## Intent

Merge the reviewed MCP policy redesign after required checks pass. The change keeps
a compact global baseline, resolves inferred and explicitly requested policies in
one call, generates the public category schema from the canonical registry,
separates command identities from policy identities, and removes the generic
fallback that treated unknown tasks as code work.

The publication also updates the service version to `1.13.0`, shortens oversized
policy modules, labels regex-presence measurements as diagnostic rather than quality
evidence, and reports that dashboard policy edits cannot change compiled
initialization or routing metadata without deployment.

## Outcome

PR 81 merged into `main` at 2026-09-23T22:28:06Z as
`65d80724828591c4d45d1113312e3b691ecfb676`.

- Required PR checks passed in GitHub Actions run `35928399852`.
- Cloudflare Workers Builds reported success for PR build
  `04c3db6d-75b6-4685-b70c-02096bad0370`.
- Post-merge CI passed in GitHub Actions run `35928504424`.
- `https://brandoriv.dev/mcp/health` returned `ok: true` and service version
  `1.13.0` after the merge.

The production Cloudflare build/version identifier was not exposed through the
available GitHub deployment status. Live health confirms that the new MCP version
was published; authenticated post-merge tool behavior was not re-run.

## Rollback

Revert the merge and let Workers Builds republish the preceding source revision, or
roll Cloudflare traffic back to the Worker version recorded as `Previous` above.
KV policy versions were not changed by this publication.
