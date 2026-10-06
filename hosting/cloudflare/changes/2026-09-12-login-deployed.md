# Browser nonce fix deployed

- Event time (UTC): PR #22 merged at `2026-09-12T16:06:45Z`; the Cloudflare
  deployment was created at `2026-09-12T16:07:28.174505Z`.
- Recorded on (UTC): 2026-09-12.
- Record type: contemporaneous completion of the
  [previously recorded operation](2026-09-12-login-nonce.md).
- Actor: Codex using the owner's GitHub workflow; Cloudflare Workers Builds
  published the Worker. Codex performed the subsequent live checks.
- Targets: Cloudflare Worker `brandoriv-dev`, `https://brandoriv.dev/harness`.
- Status: applied and verified for proxy/API behavior and the initial browser
  login challenge; interactive Microsoft sign-in was not completed.
- Source: [PR #22](https://github.com/BrandoRiv/brandoriv-dev/pull/22), implementation
  `ae4c4f94c5e3e65965f802069c9ef53358f09948`, merge revision
  `16c8cf9526b6f1c63fb9e5c4cdfe494612feb664`.
- Provider deployment: `eea3ed37-f767-4468-b648-bf3b018bf1f3`, Worker version
  `aae6669e-dae8-4e3a-8828-0cd2d89e0547`, receiving 100% of traffic.

## Reason and change

The Azure login challenge uses an exact `Nonce` cookie. The website proxy's cookie
filter previously omitted it from callback requests. PR #22 forwards that exact
cookie while continuing to exclude unrelated website sessions and similarly named
cookies. The implementation is in [`mcp/harness.ts`](../../../mcp/harness.ts), with
regression coverage in [`mcp/harness-test.mjs`](../../../mcp/harness-test.mjs).

This completion record preserves the original plan as written and records its
outcome separately. The Azure authentication configuration remained as described
in the [backend baseline](../../azure/changes/2026-09-11-harness-deployment-baseline.md).

## Execution and verification

The checked PR was merged through the existing GitHub workflow, and Cloudflare
published the deployment identified above. All PR checks passed, including the
13 proxy cases and actual Worker runtime coverage. The initial post-merge CI
attempt encountered an intermittent failure in an unchanged authentication test;
the rerun of [CI run 34704239017](https://github.com/BrandoRiv/brandoriv-dev/actions/runs/34704239017)
passed on the same revision. No rollback or test change was made for that failure.

Live checks after publication on 2026-09-12 established:

- Anonymous API requests returned 401; owner-authenticated API requests returned
  200 through the public website route.
- Dashboard HTML, JavaScript, and CSS were served successfully, and a same-origin
  authenticated POST passed.
- An ordinary unauthenticated browser request redirected to Microsoft with the
  correct `https://brandoriv.dev/harness/.auth/login/aad/callback` redirect URI.
- The login challenge's `Nonce` cookie retained `Secure`, `HttpOnly`,
  `SameSite=None`, and `Path=/harness` attributes.

The proxy regression test covers nonce forwarding through a callback. These live
checks cover the challenge and API, not completion of interactive Microsoft SSO.
No credentials, cookie values, or raw identity responses are included here.

## Rollback

No rollback was performed. Revert the two proxy implementation/test files through
a checked PR if this revision introduces a regression, preserving the prior cache
fix and unrelated MCP changes. Reverting the nonce change restores the known
callback defect, so it is a mitigation rather than a verified login solution.
Website rollback does not alter Azure settings or durable Harness state.

## Drift and follow-up

This operation changed the tracked Worker implementation and did not mutate Azure
configuration. No additional proxy configuration drift was identified by the
checks above; they were not a complete infrastructure drift audit. Full interactive
owner sign-in remains unverified.

Subsequent Harness application/UI publications belong in the source repository's
`agent-harness/Azure/changes/` journal. The website needs a new Harness operation
record when its own proxy, route, or related external configuration changes.
