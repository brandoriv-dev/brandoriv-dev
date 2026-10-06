# Azure and Entra

This directory records Azure changes whose effects live outside Git: deployments,
Entra registrations, role assignments, settings, schedules, budgets, and recovery
actions. Source commits explain intended configuration; these records explain what
was actually changed and checked.

The shared operation-record convention and template that used to open this file
now live in [hosting/README.md](../README.md#shared-operation-record-convention) and
[hosting/change-template.md](../change-template.md). Cloudflare Worker operations,
including the former MCP and Harness component journals, are in
[cloudflare/changes](../cloudflare/changes/README.md).

Related records filed under another service because that service is their primary
target:

- [Clean up retired MCP cloud credentials](../cloudflare/changes/2026-09-30-clean-retired-mcp-cloud-resources.md)
  deleted Entra application `2cf1ac79-78e8-4327-afcd-8bb5110c2bb3`.
- [MCP authentication baseline](../cloudflare/changes/2026-09-12-authentication-baseline.md)
  records the retired MCP's Microsoft application requirements.
- [Synchronize the website with the deployed Moss revision](../cloudflare/changes/2026-10-03-moss-release-synchronization.md)
  depends on Azure source `func-moss-7b5a92e0b4c1` in `rg-moss`.

## History

The Harness application source is maintained in the sibling `agent-harness`
repository. Its Azure journal owns subsequent backend operations. This website
keeps the historical baseline and records changes to its public route in the
[Cloudflare journal](../cloudflare/changes/README.md).

<!-- records:begin -->
- [Record retired MCP identity cleanup](changes/2026-09-30-retired-mcp-identity-cleanup.md)
- [Prepare Azure source of truth for MCP Jev routing configuration](changes/2026-09-27-mcp-jev-routing-config-plan.md)
- [Harness Azure deployment baseline](changes/2026-09-11-harness-deployment-baseline.md)
<!-- records:end -->
# Shared subscription ownership register: hosting inventory

Documentation format version: **1.0.0** (separate from application/deployed versions).
Repository: [brandoriv-dev/brandoriv-dev](https://github.com/brandoriv-dev/brandoriv-dev).
Subscription: `a3fefd88-bd76-40bf-9f2b-6f87dc707790`. Association is shared/unresolved, as stated in the inventory.

Documentation register for shared infrastructure and unmatched legacy resources; no application ownership is asserted.

Latest inventory: [2026-10-06](2026-10-06-inventory.md) (corrects [2026-10-03](2026-10-03-inventory.md)). Persistent stores: [Database](../database/README.md).

## Maintenance

Keep this README as a brief current index. Add root-level ISO 8601 records `YYYY-MM-DD-description.md`; use a UTC `THH-mm-ssZ` suffix for collisions. Include observed UTC time, repository/source revision, provider/resource identity, purpose, environment, likely deployment scripts, verification, drift and unknowns. Distinguish confirmed source paths from inferred historic commands. Preserve old records and link corrections; never store secret values or raw exports.

Version the documentation format semantically: major for incompatible fields, minor for added fields, patch for clarification. Keep application/schema versions and deployed revisions separate, using **unknown** when unverified. Update the index after meaningful hosting changes/audits. Routine green CI retains workflow/package receipts; existing `changes/` journals continue recording exceptional applied operations and outcomes. Documentation adds no approval step to already authorized work.

## Existing operation history
Cross-project association: [ownership register](2026-10-06-ownership-register.md) (corrects [2026-10-03](2026-10-03-ownership-register.md)).
Use [inventory-template.md](inventory-template.md) for dated root inventory records.
