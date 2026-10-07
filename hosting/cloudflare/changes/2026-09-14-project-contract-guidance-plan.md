# Project contract guidance publication plan

- **Status:** Planned
- **Actor:** Codex
- **Target:** `https://brandoriv.dev/mcp` on the existing Cloudflare Worker
- **Intent:** Publish the engineering rule that shared contracts update their
  README or runbook, test every known downstream app, and identify unverified
  consumers.
- **Source:** Pending commit from the `add-harness-dashboard` worktree
- **Pre-deployment verification:** Full site build; MCP type, authentication,
  dashboard, routing, Harness proxy, and policy evaluation suites.
- **Post-deployment verification:** Cloudflare deployment result and live MCP smoke
  test, including tool guidance over the supported protocol dates.
- **Rollback:** Redeploy the preceding verified Git revision.
- **Expected differences from infrastructure code:** None. This changes source and
  documentation only; no Cloudflare, DNS, secret, Entra, or Azure configuration is
  intended.

Do not mark this operation complete until the deployed revision and live checks are
recorded in a separate completion entry.
