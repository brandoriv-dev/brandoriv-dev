# Workbench instructions

- Work inside one named project. Read `PROJECTS.md` only when the target is unclear; do not recursively inventory Workbench.
- The fixed Git repositories in this folder are audit-only. Before changing one, read its `AGENTS.md` and use its WorkspaceManager command to obtain a leased clone.
- Do not edit `.tasks` directly. Search it, dated `ai-artifacts`, dependencies, Git internals, and generated test/build output only when the task specifically requires them.
- Put disposable generated evidence in `ai-artifacts/YYYY-MM-DD/<task-slug>/`. Use `scripts/new-ai-artifact.ps1` so the task has a manifest.
- Keep durable source, decisions, and operating history in the owning repository. Never store secrets or raw authentication exports in Workbench artifacts.
- Repository-local `AGENTS.md` files govern project work. Preserve user files and avoid broad cleanup, reset, or overwrite operations.

## Agent operating contract

Every agent task must end in one recorded handoff state:

- `no-change`: investigation only, with no workspace changes.
- `pr-open`: owned changes committed, pushed, and linked in a PR.
- `local-committed`: owned changes committed in the leased clone; report its path,
  branch, revision, verification, and pending publication when push is not authorized.
- `blocked-clean`: no useful progress is possible, and owned scratch changes are committed, stashed, or removed.

Before finishing, run `scripts/workbench-agent-contract.ps1 -RepositoryPath <owned-clone>`
from Workbench. Use `-Root C:\Workbench` only for a requested global audit. Report
owned dirty state, unpushed work, open PRs, and verification gaps. Preserve other
agents' work. Allocation is local-only; push, merge, deploy, and deletion require
Brandon's explicit authorization in the current request. An older repository
instruction mentioning a pushed allocation does not authorize publication.

For repository work, prefer one branch and one PR per user objective. Resume the
exact existing TaskId when safe rather than allocating duplicates. If a matching
open PR exists, reuse it when publication is authorized. Merge only with explicit
authorization and after required checks pass. Report stale or superseded PRs for
an explicit closure decision.

## Cross-chat coordination

Use the existing owner's latest handoff before starting or waking another task.
Keep desktop coordination here; shared unattended CI behavior belongs to
`brandoriv-dev/cicd` and guidance diagnostics/calibration belong to Bstack #84.

- Start with a compact status snapshot (`wait_threads` with `timeoutMs: 0` when
  available) or the latest turn (`read_thread` with `turnLimit: 1`,
  `includeOutputs: false`). Use known thread IDs rather than dumping every chat.
- Filter the returned object **before emitting it**. Keep the thread/turn IDs,
  relevant user intent, current status and latest relevant result. Discard tool
  arguments, reasoning, command records and outputs from the initial summary.
  Bound that summary to 2,000 characters; mark omitted/truncated detail and keep
  the cursor for a specific follow-up. This is an emission limit, not a host
  retrieval or account-usage limit.
- `maxOutputCharsPerItem` bounds included output items, not a whole turn. A turn
  can still contain large imported history when outputs are omitted. Never print
  the raw response and filter it afterward. For a missing fact, name the question,
  fetch its source turn/cursor with a small limit, then emit only the answer and
  its source IDs. Include an output only when that particular evidence is needed.
- Reuse the existing handoff for blockers: record observation time in UTC, exact
  run/job/attempt and source head (or precise access evidence), owner, next action,
  and the condition that clears or invalidates the blocker. Refresh that evidence
  before repeating a budget, permission or runner explanation. Registration,
  occupied capacity, checkout TLS errors, communication loss and test failure are
  different observations; queued work alone does not establish which one applies.
- Before dispatch, compare the blocker, evidence identity and requested action
  with the latest owner receipt. Suppress an unchanged acknowledgement request.
  Send one current receipt for a new failure, recovery or material evidence change;
  do not suppress those transitions. A successful newer attempt invalidates the
  older attempt's blocker for that job, not every unrelated job or access claim.

## Authorization and verification handoffs

- For an authorized attended device flow, present the current sign-in URL, code,
  purpose and absolute expiry together in the user-visible reply. Do not leave
  them only in a terminal. If expiry is unavailable, say so; do not claim it is
  current. Check completion before dependent calls and replace an expired prompt
  only through the authorized flow. Keep temporary codes out of durable artifacts.
- Unattended agents must stop at an access failure and hand off its timestamp,
  exact failed operation, required existing access, owner and next action. They
  must not start interactive login, invent a device code, or broaden scopes.
- Assign one verification owner per checkout. Wait for existing builds to finish,
  then run the repository's existing serial verifier. Record its exact source head
  and result in the handoff. A prior self-induced overlap does not justify a new
  global lock; reconsider only after evidence of independent invocations colliding.
- Report emitted-content and dispatch counts separately from account/model usage.
  Do not claim percentage savings without attributable measurements.
