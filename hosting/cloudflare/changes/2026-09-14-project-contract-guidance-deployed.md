# Project contract guidance deployed

- **Status:** Completed
- **UTC time:** 2026-09-14T11:54:27Z
- **Actor:** Codex, using the configured Cloudflare account
- **Target:** `https://brandoriv.dev/mcp`
- **Planned operation:** [Project contract guidance publication plan](2026-09-14-project-contract-guidance-plan.md)
- **Source revision:** `3c2853d1b160429789a07c06bdfac7d60120de56`, merged to
  `main` as `e02f40e16d10463281887322f30d2c2192d491f7` with identical
  tracked content
- **Cloudflare deployment:** `2349068e-6be9-4365-9aef-73516ed7f608`
- **Cloudflare version:** `acdf517c-1d8f-4099-ae11-ec3efe1a7fb0`
- **Outcome:** The engineering category now requires shared-contract README or
  runbook updates, tests for every known downstream application, and explicit
  disclosure of untested consumers.
- **Verification:** Pull request 28 passed Policy and dashboard checks, MCP smoke,
  and Cloudflare Workers Builds. The local production build passed type checking,
  36 authentication checks, 30 dashboard checks, 29 routing checks, 13 Harness
  proxy cases, policy evaluation, Astro checks, and the production build. The
  separate Harness producer suite passed 85 tests. The live smoke suite passed the
  dashboard, authorization, body-limit, tool, resource, and guidance checks for all
  four supported MCP protocol dates.
- **Policy measurement:** 334/334 applicable rules, with zero lost baseline rules;
  serialized results are 0.1% smaller than the frozen baseline.
- **Rollback:** Redeploy `64334451f4552d5f1da708b838c4dc446180c37f` or
  Cloudflare version `933008a2-1913-4e78-87b6-7bef9d6d1085`.
- **Remaining differences from infrastructure code:** None. No DNS, route, secret,
  Entra, Azure, or Cloudflare configuration changed.

No Harness project-data tool was added. The reviewed design keeps future project
context read-only, project-scoped, timestamped, and outside baseline guidance.
