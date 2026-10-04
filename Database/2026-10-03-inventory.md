# Shared subscription ownership register: database baseline

Record version: 1.0.0
Audit date: 2026-10-03 (America/New_York)
Recorded: 2026-10-04 UTC
Status: reconstructed inventory; no database operation applied.
Repository: https://github.com/brandoriv-dev/brandoriv-dev
Subscription: `a3fefd88-bd76-40bf-9f2b-6f87dc707790`
Source revision inspected: 5db22167804285899f32917077d1911c9f15be20
Source/schema version: repository definitions inspected; deployed version unknown (not applicable where no store is assigned).
Hosting: [Azure baseline](../Azure/2026-10-03-inventory.md)

## Store and purpose

No dedicated Azure database is assigned to this repository by this audit. Application stores belong to bstack, Bullfrog, Terrarium and Slow and Steady; see the ownership register.

This is a documentation register, not a claim that no databases exist elsewhere. Historical backend creation records here remain evidence; current application data ownership follows the project repository. No data or credentials are copied.

## Likely provisioning/schema paths

- [Azure/changes/2026-09-11-harness-deployment-baseline.md](../Azure/changes/2026-09-11-harness-deployment-baseline.md)

These are confirmed files, not proof that a schema/data migration was applied. Infrastructure follows the Azure record; application code governs table/document shapes. SQL/transfer scripts are separate mutating actions requiring reviewed parameters and current authorization. No original command receipt was recovered here.

## Verification and recovery

Observed: Azure resource/storage subresource metadata and relevant Git source. Not inspected: live rows/documents, installed schema version, backup freshness, retention enforcement or restore rehearsal. Recovery status: **unknown** unless a linked existing operation journal supplies verified evidence. Git rollback does not restore persisted data; establish reader compatibility and forward recovery or a verified restore before changing state. Add linked corrections rather than rewriting historical evidence.
