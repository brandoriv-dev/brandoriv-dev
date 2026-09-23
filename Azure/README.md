# External change history

This directory records Azure changes whose effects live outside Git: deployments,
Entra registrations, role assignments, settings, schedules, budgets, and recovery
actions. Source commits explain intended configuration; these records explain what
was actually changed and checked.

Use this convention in every project going forward. Keep an `Azure/` directory at
the repository root when the project uses Azure. Components with their own external
operations also keep a `<component>/changes/` journal, including this website's
[Terrarium](../terrarium/changes/README.md) and [MCP](../mcp/changes/README.md) components.
Cloudflare, DNS, identity, and workstation changes belong in the relevant component
journal even when the component is not hosted in Azure.

## Recording an operation

1. Start with [change-template.md](change-template.md). Name the record
   `YYYY-MM-DD-short-description.md` using the event's UTC date. Add a UTC time or
   another descriptive suffix when needed to avoid a filename collision.
2. Record the target, actor, reason, before/after state, action or script revision,
   outcome, validation evidence, and rollback. Record failed and partial operations
   too. Use `unknown` for missing evidence; a merged PR is not deployment proof.
3. Record the actual UTC execution time separately from the date the record was
   written. Label historical entries `reconstructed` and cite their retained
   evidence. Keep planned work explicitly pending until the outcome is observed.
4. Commit the record with the related source change, or in a follow-up immediately
   after an external operation. For automation, retain the run/deployment ID and
   source SHA. Identify any remaining difference between live configuration and
   infrastructure as code, with the follow-up needed to remove that difference.
5. Read current Git status, fetch and compare the remote, and integrate changes
   before publishing. Use an isolated worktree for concurrent work. Stage only
   owned files and push without force. Never delete or overwrite another agent's
   files, or apply/drop its stash, to make room for your work.

Keep one authoritative record per operation in the repository that owns the
resource. Cross-link it from other affected components instead of copying it.
Once published, preserve the record and add a linked correction or follow-up when
facts change. Routine requests and task heartbeats stay in application telemetry;
operational changes to their configuration belong here.

When publishing history-only documentation triggers a rebuild of identical runtime
and configuration, Git and CI history are sufficient. Do not recursively create
another operation record solely for that documentation rebuild.

Record resource names, setting names, safe commands, and sanitized outcomes. Do not
commit tokens, passwords, secret values, cookies, account exports, raw application
state, or unreviewed CLI output. Record a secret rotation by its setting name and
result only.

## History

- [Harness deployment baseline, 2026-09-11](changes/2026-09-11-harness-deployment-baseline.md)
  — reconstructed from retained local publication output and the deployment runbook.

The Terrarium application (named Harness until 2026-09-21) is maintained in the
sibling `agent-harness` repository. Its Azure journal owns subsequent backend
operations. This website keeps the historical baseline and records changes to its
public route in the Terrarium component journal.
