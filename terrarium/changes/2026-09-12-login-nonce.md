# Preserve Azure's browser login nonce

- Event time (UTC): pending publication on 2026-09-12.
- Recorded on (UTC): 2026-09-12.
- Record type: contemporaneous.
- Actor: Codex using the owner's GitHub deployment workflow.
- Target: Cloudflare `brandoriv-dev`, `https://brandoriv.dev/harness`.
- Status: planned; implementation and local verification complete.
- Source: `mcp/harness.ts`, `mcp/harness-test.mjs`; source SHA and deployment ID
  will be recorded after publication.
- Previous deployment: [route history](2026-09-11-azure-route.md).

## Reason and change

The live Azure login challenge sets an exact `Nonce` cookie. The proxy filtered it
out on the callback, preventing Azure from validating the browser challenge.
The prepared fix forwards that exact cookie while excluding unrelated website
sessions and similar cookie names. Azure identity settings remain as recorded in
the [deployment baseline](../../Azure/changes/2026-09-11-harness-deployment-baseline.md).

## Execution and validation

Publish through the existing GitHub pull-request and Cloudflare build workflow.
Local verification on September 12 passed 13 proxy tests, including a complete
nonce round trip through the callback in the test and execution in workerd, plus
TypeScript checks. Existing live owner API access and browser redirect checks pass.
No interactive owner sign-in has been completed by the agent.

## Rollback and follow-up

If this change regresses unrelated routes, revert its two implementation files
through a new PR and verify the prior deployed behavior. That would restore the
known nonce-forwarding defect; it is a mitigation, not a verified login solution.
Do not roll back the earlier no-store cache fix. No rollback has been performed.
Record the actual deployed revision, provider deployment ID, and post-deployment
checks in a follow-up. This change requires no Azure configuration mutation.
