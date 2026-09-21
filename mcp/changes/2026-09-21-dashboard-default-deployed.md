# Dashboard default rule and MCP overview deployed

- **Event time (UTC):** 2026-09-21T23:23:39Z merge; production build completed afterward.
- **Status:** Published and verified.
- **Actor:** Codex on Brandon's behalf
- **Source:** PR [#47](https://github.com/BrandoRiv/brandoriv-dev/pull/47), merge `85cd656c97891402a62a3bd0fa87b14246d546e5`
- **Deployment:** Cloudflare Workers build `55add4d4-2645-47d9-86a9-fef1918f8f3f`
- **Outcome:** Added `personal://dashboard-default` under Design as an explicit-only policy invoked by `/dashboard-default`. The MCP overview now uses the approved Relay-derived hierarchy: personal orientation, one operational signal, one dominant policy-payload comparison, and subordinate evidence modules. Existing Policies and Connect behavior is unchanged.
- **Verification:** The full local production build passed 36 Microsoft-auth checks, 10 answer-study checks, 41 dashboard checks, 7 policy-store checks, 41 routing checks, 13 Harness proxy cases, all 383 deterministic policy patterns, Astro diagnostics, and static build. PR and merged-main CI passed. Production HTML returned asset version `1.13.0`, the new greeting, and `Policy payload at a glance`.
- **Known unrelated check:** The separately configured answer-study workflow reported failure on the main push and produced no job log. It has failed on earlier main revisions and does not build or deploy the MCP service; CI, smoke, and Cloudflare deployment all passed.
- **Rollback:** Revert PR #47 and redeploy the preceding main revision `9e58c91a01c97ee08fb53d78ba85e7ff3e5ca2d4`.
