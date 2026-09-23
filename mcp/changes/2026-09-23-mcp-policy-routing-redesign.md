# Publish the MCP policy-routing redesign

- Status: planned
- Verified: not checked
- Checked: nothing; the publication operation has not been attempted
- Not checked: corrected CI smoke result, merge, production publication, and live `1.13.0` health/tool behavior; the agent will check these before and after merge
- When (UTC): 2026-09-23T22:18:00Z (planned)
- Actor: Cursor agent for Brandon Rivera
- Target: GitHub `BrandoRiv/brandoriv-dev` `main`; Cloudflare Worker `brandoriv-dev`; `/mcp`, `/mcp/health`, dashboard policy data, tools, resources, and `grill-me` prompt
- Previous: live MCP service version `1.11.1`, observed from `https://brandoriv.dev/mcp/health` on 2026-09-23
- Deployed: none
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

Not attempted yet. Update this record after merge and publication with the merge
revision, CI run, Cloudflare build and Worker version, production verification, and
any remaining difference from repository policy.

## Rollback

Revert the merge and let Workers Builds republish the preceding source revision, or
roll Cloudflare traffic back to the Worker version recorded as `Previous` in the
completed outcome. KV policy versions are not intended to be changed by this
publication.
