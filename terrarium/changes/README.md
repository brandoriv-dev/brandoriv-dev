# Terrarium external changes

This journal records operations affecting `https://brandoriv.dev/terrarium`
(`/harness` until 2026-09-21; earlier records keep the old name): website
proxy publication, Cloudflare route/variable changes, authentication callbacks,
and cross-repository coordination with the Azure control plane. It is an operations
journal; the application source lives in the sibling `agent-harness` repository.

Follow the [shared convention](../../Azure/README.md) and
[template](../../Azure/change-template.md). Place records here as
`YYYY-MM-DD-short-description.md`, with actual UTC event time, actor, target,
source/action reference, observed result, validation, rollback, and drift follow-up.
Record failed and partial operations as well as successful ones. Link the backend
repository's authoritative Azure record when an operation spans both repositories.

Keep dashboard policy, worker permission, and workstation scheduler changes in the
repository that owns them and link them here only when the public route is affected.
Routine task and heartbeat events remain in Terrarium state and telemetry.

- [Initial Azure route and runtime cache fix, 2026-09-11](2026-09-11-azure-route.md).
- [Browser nonce forwarding plan, 2026-09-12](2026-09-12-login-nonce.md).
- [Browser nonce fix deployed and checked, 2026-09-12](2026-09-12-login-deployed.md).
- [Project dashboard and shared theme deployed to Azure, 2026-09-13](https://github.com/BrandoRiv/agent-harness/blob/main/Azure/changes/2026-09-13-dashboard-deployed.md).
