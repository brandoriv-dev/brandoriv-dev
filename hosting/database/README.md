# Shared subscription ownership register: database and persistent state

Documentation format version: **1.0.0**. Application/schema versions are separate.
Repository: [brandoriv-dev/brandoriv-dev](https://github.com/brandoriv-dev/brandoriv-dev).
Latest inventory: [2026-10-03](2026-10-03-inventory.md). Hosting: [Azure](../azure/README.md).

No dedicated Azure database is assigned to this repository by this audit. Application stores belong to bstack, Bullfrog, Terrarium and Slow and Steady; see the ownership register.

## Maintenance

Keep this README as the brief current ownership/version index. Use [change-template.md](change-template.md) for meaningful inventory, schema, migration, access, retention, backup or recovery records named `YYYY-MM-DD-description.md` (ISO 8601; optional UTC `THH-mm-ssZ` suffix). State observed UTC time, source/deployed versions, exact store identity, scripts and safe evidence. Distinguish planned, reconstructed and verified outcomes; use **unknown** instead of guessing. Preserve old records and link corrections.

Version the documentation format semantically: major for incompatible structure, minor for added fields, patch for clarification. Schema versions follow the existing migration mechanism. Before an authorized change, document migration order, reader compatibility, backup and rollback limits; afterward record UTC outcome and verification. Link Azure/CI receipts rather than duplicate them. Explicitly record absence when no dedicated database exists. Never commit credentials, connection-string values, rows, financial exports or dumps.

## Source of truth

- [azure/changes/2026-09-11-harness-deployment-baseline.md](../azure/changes/2026-09-11-harness-deployment-baseline.md)
