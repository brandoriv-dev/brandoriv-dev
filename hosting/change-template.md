# <Imperative title: what was done to what>

- Status: planned | applied | partial | failed | rolled back
- Verified: checked | partly | not checked | blocked
- Checked: <each check performed, and what it showed>
- Not checked: <what was not checked, why, and who can perform it — or "nothing">
- When (UTC): <ISO 8601; a full timestamp once the change is applied>
- Actor: <agent or person> for <who they acted for>
- Target: <provider, exact resource identifier, and every affected route or scope>
- Previous: <identifier of the state this replaced, or "unrecorded", or "none">
- Deployed: <identifier of the state this created>
- Supersedes: <record filename>            (optional)
- Operation: <shared slug for a cross-repository operation>   (optional)
- Source: <PR, merge SHA, run or deployment id>               (optional)

## Intent

<Why this was needed, and what existed before. Separate what was observed from
what was intended.>

## Outcome

<What actually changed. Observed values, not assumptions.>

<Extra sections are encouraged and are usually the most valuable part of a record:
what could not be checked, a risk accepted, a pre-existing failure that this change
did not introduce, a rollback procedure with limits, remaining drift from
infrastructure code. Write the ones that apply and leave out the ones that do not.>

---

## How to fill this in

**Status describes the external system only.** Work that is implemented and
verified locally but not yet merged or published is `planned`. Nothing about a
branch, a local build, or a passing test suite makes a change `applied`.

**Verified is separate from Status on purpose.** Whether a change happened and
whether anyone checked it are two facts, and the previous convention collapsed
them into one field, which grew 27 spellings across 51 records. Keep them apart.

- `checked` — every check you set out to perform was performed. Requires
  `Not checked: nothing`, which is a specific claim a reviewer can attack.
- `partly` — some checks ran, others did not.
- `blocked` — the check is defined, and this environment cannot perform it. The
  recurring real case here is anything needing a signed owner browser session.
- `not checked` — nobody checked. A legitimate answer; say so plainly.

**`Not checked` is where the journal earns its keep.** "An owner-authenticated
production catalog render was not automated" is worth more to a later reader than
any amount of green. Name the check, the reason, and who can perform it, so the
line doubles as a queue: `grep -r "^- Not checked:" hosting/*/changes */changes` is the standing list
of what this workspace knows it has not confirmed.

**`Previous` supplies rollback context.** Record the exact state you observed and
replaced, or `unrecorded` if it genuinely was not captured — never a guess.
`Deployed` records what this operation created. The journal is selective, so these
fields are not treated as a complete deployment chain; routine green deployments
are tracked by CI deployment receipts instead.

**When a record is required.** Record an operation whose effect a `git revert` plus
a redeploy would not undo: identity, secrets, DNS, routes, provisioned resources,
stored data, account and permission changes. Also record any deployment where
verification found something surprising. A merge that CI published with green
checks and no surprises does not need a record — the PR already is one.

**One file per operation.** Write the header and `## Intent` before the change,
and fill `## Outcome` in a second commit to the same file afterwards. The file's
git history carries the plan/outcome separation, and an operation cannot end up as
an orphaned plan that never got its result.

`node scripts/changes-lint.mjs` checks the shape of all of this. It deliberately
does not read your prose for truth; it can only make you name things.

## Persistent store records

This template also replaces the former `hosting/database/change-template.md`.
Meaningful inventory, schema, migration, access, retention, backup or recovery
records for a persistent store use the fields above, plus these lines in the
header. Write **unknown** instead of guessing; for history rebuilt from evidence,
say that it is reconstructed and name the evidence.

- Record version: 1.0.0
- Provider/resource/store identity: <exact store identity>
- Environment: <environment>
- Application version: <application version, or unknown>
- Schema/document version (before -> after): <versions, or unknown>
- Backup/retention/restore evidence: <evidence, or unknown>
- Rollback or forward-recovery limits: <limits, or unknown>
- Related Azure/CI record: <link, or unknown>

Distinguish observed facts, source definitions and inference. Include safe
receipts and links; never rows, secrets or raw exports. Link provisioning and
migration scripts; record parameter names, prerequisites, execution order and
reader compatibility. Mark destructive or irreversible steps and unknown original
commands, and separate actual execution from proposals.
