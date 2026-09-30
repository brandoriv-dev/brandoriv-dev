# External change history

This directory records Azure changes whose effects live outside Git: deployments,
Entra registrations, role assignments, settings, schedules, budgets, and recovery
actions. Source commits explain intended configuration; these records explain what
was actually changed and checked.

Use this convention in every project going forward. Keep an `Azure/` directory at
the repository root when the project uses Azure. Components with their own external
operations also keep a `<component>/changes/` journal, including this website's
[Harness](../harness/changes/README.md) and [MCP](../mcp/changes/README.md) components.
Cloudflare, DNS, identity, and workstation changes belong in the relevant component
journal even when the component is not hosted in Azure.

## When a record is required

Record an operation whose effect a `git revert` plus a redeploy would not undo:
identity, secrets, DNS, routes, provisioned resources, stored data, account and
permission changes. Also record any deployment where verification found something
surprising, and any failed or rolled-back attempt.

A merge that CI published with green checks and nothing unexpected does not need a
record. The pull request already is one, and a journal that restates every merge
buries the operations that genuinely live outside Git.

## Recording an operation

1. Start with [change-template.md](change-template.md). Name the record
   `YYYY-MM-DD-short-description.md` using the event's UTC date. Add a UTC time or
   another descriptive suffix when needed to avoid a filename collision.
   Write one file per operation: the header and `## Intent` before the change,
   `## Outcome` in a second commit to the same file afterwards. Do not write a
   separate plan file and outcome file; an operation that is written as a pair can
   end up as a plan that never received its result.
2. Record the target, actor, reason, the state replaced (`Previous:`), the state
   created (`Deployed:`), what was and was not checked, and the rollback. Record
   failed and partial operations too. A merged PR is not deployment proof. For
   an applied operation, `Target:` must include the provider and an exact resource
   identifier, and `Deployed:` must identify the resulting state.
3. `Status` describes the external system only: implemented and verified locally is
   still `planned`. `Verified` is a separate field, because whether a change
   happened and whether anyone checked it are two different facts. Reconstructed
   history must name the evidence it was rebuilt from and what remains unknown.
4. Commit the record with the related source change, or in a follow-up immediately
   after an external operation. For automation, retain the run/deployment ID and
   source SHA. Identify any remaining difference between live configuration and
   infrastructure as code, with the follow-up needed to remove that difference.
5. Read current Git status, fetch and compare the remote, and integrate changes
   before publishing. Use an independent clone for concurrent work; do not share
   a working tree or Git metadata with another task. Stage only owned files and
   push without force. Never delete or overwrite another agent's files, or
   apply/drop its stash, to make room for your work.
6. Do not hand-edit the record list in an index README. It is generated between the
   `records:begin` and `records:end` markers by `node scripts/changes-lint.mjs
   --index`, so that two agents adding records at once do not conflict on a single
   append point, and so a resolved conflict cannot silently drop someone's link.

## What CI checks

`node scripts/changes-lint.mjs` runs in the `checks` job on every pull request. It
verifies shape only: required fields, the `Status` and `Verified` enums, a full
timestamp once a change is applied, exact `Target:`, `Previous:`, and `Deployed:`
identifiers on applied changes, an up-to-date index block, and the absence of
credential-shaped strings.

The journal deliberately does not enforce a deployment chain. Routine green CI
deployments are not journaled, so the last exceptional record is not necessarily
the state that an operation replaced. Deployment receipts carry complete routine
continuity; `Previous:` in an exceptional record is the observed rollback context
for that operation, not a claim that the journal is a complete release ledger.

It deliberately does not read the prose for truth. A lint that graded a validation
section would teach everyone to write whatever passes, and the journal would end up
always saying everything was checked. CI supplies facts; a person supplies judgement.

Records written before 2026-09-24 are listed in `scripts/changes-lint-baseline.txt`
and skip the shape checks, because published records are preserved rather than
rewritten. That list is closed: a record dated on or after 2026-09-24 is held to the
standard whatever the file says, and there is no flag to regenerate it. If the lint
is red, fix the record.

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

The Harness application source is maintained in the sibling `agent-harness`
repository. Its Azure journal owns subsequent backend operations. This website
keeps the historical baseline and records changes to its public route in the
Harness component journal.

<!-- records:begin -->
- [Record retired MCP identity cleanup](changes/2026-09-30-retired-mcp-identity-cleanup.md)
- [Prepare Azure source of truth for MCP Jev routing configuration](changes/2026-09-27-mcp-jev-routing-config-plan.md)
- [Enable branch deletion on merge across the workspace repositories](changes/2026-09-23-repository-merge-settings.md)
- [Harness Azure deployment baseline](changes/2026-09-11-harness-deployment-baseline.md)
<!-- records:end -->
