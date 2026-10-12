# Quarantine finished published follow-up branches

- Status: planned
- Verified: not checked
- Checked: native manager lifecycle/integrity/canary tests passed, including five new preservation assertions; independent review found no actionable safety regression; a read-only probe of completed CICD task `1ff84f50e2a74b8eb12af975b2c9c7c8` verified every retained commit against live main without changing HEAD or checkout status
- Not checked: required PR and main checks, checked-source installation, new installed canary, and actual quarantine using this version remain pending
- When (UTC): 2026-10-12T04:20:00Z
- Actor: Codex for Brandon Rivera
- Target: installed Workspace Manager and its existing daily cleanup action
- Previous: installed script SHA-256 `0CA2B326849CAB34FB9C0D1FAF68B42935CEA0DB45A3200A1F39A98F86137BE0`; source `e9f928a2e6666ab2bd0936024bfd93fd2450770e`; daily 03:15 local action, ten-task cap, 600-second budget, purge off
- Deployed: pending; this record does not claim installation or quarantine with the new source
- Operation: 2026-10-12-published-follow-up-cleanup
- Source: prepared from checked main `165b575318d7fb36dbec8f4255f92f30747d973a`; exact published head and checked installation outcome will be recorded after execution

## Intent

A completed CICD owner published its approved follow-up on another local branch.
Both exact branch histories reached main, but the cleaner retained the clone
solely because the current branch differed from ownership metadata. The clone
is clean, has no stashes, and retains its original manager-owned branch.

For this case, cleanup requires explicit completed or abandoned status, an
attached current branch, the original owned ref, and exactly one live advertised
main tip. Every retained local branch/tag and HEAD must be a commit ancestor of
that immutable main tip. Another advertised feature branch or tag is insufficient.
Existing path, origin, dirty/stash, lease, noncommit-ref, integrity, deadline and
bounded authenticated GitHub checks remain required. Unproven source stays put.

This proof changes neither the clone's refs nor its ownership metadata. It
permits the ordinary integrity-checked quarantine, retaining the whole clone.
Resume still requires the original owned branch; this change cannot grant an
active lease or repair a working checkout. Purge remains disabled.

## Execution and recovery

Install only the normally checked merged source, verify installed bytes and a
fresh source-bound canary, then retain the existing daily task settings. Run the
installed cleanup against the demonstrated finished task and record its actual
transaction and quarantine destination. Before installation, preserve the prior
script, manifest, installation metadata, canary and task definition. If checks
fail, restore those exact prior installation artifacts; do not mutate the held
clone. Quarantined data stays recoverable under its complete integrity manifest.

## Outcome

Source preparation is complete; installation and actual quarantine remain pending
the protected source checks and installed canary described above.

Evidence: `C:\Workbench\ai-artifacts\2026-10-11\non-date-gated-completion\workspace-published-follow-up-tests.log`
and the read-only `probe-published-follow-up.ps1` result for source head
`99cb7e62cc64bb210d626537192ccf9ddfe36364`. No installation or permanent deletion
has been performed by this preparation.
