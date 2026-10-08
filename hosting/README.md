# Hosting records

Documentation format version: **2.0.0**. 2.0.0 replaced the root `Azure/` and
`Database/` folders and the `mcp/changes/` and `harness/changes/` component journals
with this folder (2026-10-05). Record file names did not change.

This folder holds everything about hosted and external services whose state is not
tracked in code: current-state inventories and the dated history of out-of-band
operations. Infrastructure-as-code stays with the code and is linked from the index
below. Nothing here is part of the deployed site or Worker: Astro builds only `src/`
and `public/`, and the Worker bundle starts at `mcp/worker.ts`.

```
hosting/
  README.md            This index and the shared operation-record convention.
  change-template.md   The operation-record template (checked by scripts/changes-lint.mjs).
  <service>/
    README.md          Current state.
    YYYY-MM-DD-*.md    Inventories, audits, migration/cutover checkpoints.
    changes/           Dated out-of-band change records.
```

## Services

Values come from the records linked here and from `wrangler.jsonc`. "unknown" means
no record establishes the value.

| Service | What runs there | Environments | IaC location | Owner / shared | Records | Latest record |
|---|---|---|---|---|---|---|
| Cloudflare | Worker `brandoriv-dev`: static site assets, retired `/mcp` (410), `/moss` catalog, and `/harness` and `/ledger` proxies; `MCP_POLICIES` KV is preserved. Passing `main` commits deploy from Brandon's device; the former Workers Builds Git connection is retired ([cloudflare](cloudflare/README.md)). | production (`brandoriv.dev`); others unknown | `wrangler.jsonc` (repository root) | Owned by this repository; account `3d873c2936146d4f557d0c2b469f69ac` | [cloudflare](cloudflare/README.md), [changes](cloudflare/changes/README.md) | [2026-10-07 device deployment](cloudflare/changes/2026-10-07-device-deployment.md) |
| Azure and Entra | No resources owned by this repository. Register for the shared subscription's unmatched resources (`plan-BigLift-dev`, `NetworkWatcher_centralus`). The Harness, Ledger and Moss Function Apps that the Worker proxies or vendors belong to other repositories. The MCP's Entra application was deleted on 2026-09-30. | unknown | none in this repository: manual. Harness backend templates are in sibling `terrarium` (`infra/main.bicep`). | Shared subscription `a3fefd88-bd76-40bf-9f2b-6f87dc707790` | [azure](azure/README.md), [changes](azure/README.md#history) | [2026-10-03 inventory](azure/2026-10-03-inventory.md); change [2026-09-30 retired MCP identity cleanup](azure/changes/2026-09-30-retired-mcp-identity-cleanup.md) |
| Database | No dedicated store assigned to this repository. The policy KV namespace is listed under Cloudflare. | not applicable | none | Stores belong to bstack, Bullfrog, Terrarium and Slow and Steady | [database](database/README.md) | [2026-10-03 baseline](database/2026-10-03-inventory.md) |
| GitHub | Repository `brandoriv-dev/brandoriv-dev`; Actions `ci.yml` checks and deploys passing `main` commits from the device; `answer-study.yml` remains manual; production environment is main-only | not applicable | `.github/workflows/`; repository settings: manual | Owned; reusable CI/CD belongs to `brandoriv-dev/cicd` | [github](github/README.md), [changes](github/README.md#records) | [2026-10-07 device runner](github/changes/2026-10-07-device-runner.md) |
| Anthropic API | Used by the manual `answer-study.yml` workflow through repository secret `ANTHROPIC_API_KEY` | not applicable | none: manual | unknown | No folder | [2026-09-21 answer-study pipeline](cloudflare/changes/2026-09-21-answer-study-pipeline.md) |
| TypeSafe (Jev) | Jev shadow routing endpoint `TYPESAFE_ENDPOINT`; `JEV_ROUTING_MODE` is `off` and the `TYPESAFE_API_KEY` Worker secret was removed on 2026-09-30 | production Worker vars | `wrangler.jsonc` vars; secret: none: manual | unknown | No folder | [2026-09-30 cloud credential cleanup](cloudflare/changes/2026-09-30-clean-retired-mcp-cloud-resources.md) |
| bstack.tools | Event endpoint `BSTACK_TOOLS_EVENT_ENDPOINT`; the `BSTACK_TOOLS_EVENT_TOKEN` Worker secret was removed on 2026-09-30 | production Worker vars | `wrangler.jsonc` vars | unknown | No folder | [2026-09-30 cloud credential cleanup](cloudflare/changes/2026-09-30-clean-retired-mcp-cloud-resources.md) |
| Web3Forms | Contact form delivery through build variable `PUBLIC_WEB3FORMS_KEY` (see the root README) | unknown | none: manual | unknown | No records | none |

Workstation operations (WorkspaceManager installs and scheduled tasks) are not a
hosted service. They stay in [workspace/changes](../workspace/changes/README.md).

## Shared operation-record convention

Use this convention in every project going forward. Keep one root `hosting/` folder
with one `<service>/` folder per external system, and record out-of-band operations
in `hosting/<service>/changes/`, under the system whose state changed. A journal
scoped to a component that spans several providers may move whole to
`hosting/<component>/changes/` and list those providers in this index. Records that
span services live under the primary service and are linked from the others'
README.

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
