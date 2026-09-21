# Real model-answer quality study, plus a post-merge pipeline

- **Status:** Applied; deterministic suites verified locally; not yet merged
- **Recorded on (UTC):** 2026-09-21
- **Actor:** Claude Code on Brandon's behalf, with the user's explicit authorization to use the Agent tool for this run (asked first; see rationale below)
- **Target:** `mcp/corpus.mjs` (new, shared corpus extracted from `mcp/policy-eval.mjs`), `mcp/answer-study.mjs` (new), `mcp/answer-study-test.mjs` (new), `mcp/evaluation.ts`, `mcp/dashboard-test.mjs`, `mcp/smoke.mjs`, `mcp/README.md`, `package.json`, `.github/workflows/ci.yml`, `.github/workflows/answer-study.yml` (new), `mcp/assessments/answer-study/2026-09-20-session-agent-run-1/`

## Reason and change

The dashboard's "Recorded quality" panel had shown "Not measured" since the v1.5.0 rebaseline: `visibleAnswerTokens`, `blindJudge`, and `strictJudge` were zeroed placeholders. Brandon asked to identify what those fields are supposed to measure, get real values, and — ideally — wire the measurement into the pipeline so it runs on merge rather than staying a one-off.

**What the fields mean**, confirmed by reading `public/mcp/dashboard.js`'s rendering and `mcp/policy-eval.mjs`'s corpus:
- `visibleAnswerTokens`/`visibleAnswerWords`: size of the model's visible answer text (not the tool JSON payload), baseline vs. candidate policy.
- `blindJudge`: an independent judge, blind to which transcript position is baseline/candidate, accepts or rejects each answer and flags hard defects (confidently wrong facts, non-compiling code shown as correct, unsafe advice).
- `strictJudge`: a stricter accept/reject bar, plus a forced head-to-head preference per case, tallied as candidate wins/losses/ties.

**Infrastructure built:**
- `mcp/corpus.mjs`: the 26-case representative task corpus and `formatGuidance`/`wordCount`/`percentChange` helpers, extracted out of `policy-eval.mjs` so the answer study measures the exact same tasks with no risk of drift between the two suites.
- `mcp/answer-study.mjs`: for each case, calls a model twice (baseline guidance, candidate guidance) via the Anthropic Messages API, then a blind judge and a strict judge, retains every transcript under `mcp/assessments/answer-study/<runId>/`, and (`--write`) patches only the five answer-study-owned fields in `evaluation.ts`, asserting each match is unique so a shape change fails loudly instead of silently no-opping. A `--aggregate <runId>` mode re-scores an already-retained run without a live call.
- `mcp/answer-study-test.mjs`: deterministic tests against fixture transcripts (JSON extraction from judge prose, the position-remap logic, and that `writeEvaluationSnapshot` never touches fields it doesn't own) — added to `bun run build` and `ci.yml`, since this part is fully reproducible and costs nothing.
- `.github/workflows/answer-study.yml`: runs the live study on push to `main` (after merge, never on a PR, to bound cost), inert until `ANTHROPIC_API_KEY` is added as a repository secret, defaults to an 8-case sample via `vars.ANSWER_STUDY_CASES`, re-runs the deterministic suites against the refreshed snapshot, and opens a PR with the new `evaluation.ts` and transcripts rather than pushing directly to `main`.

**Getting real numbers today:** this session had no `ANTHROPIC_API_KEY`, and the session's own policy is not to use the Agent tool (subagents) without being asked. Judging your own just-written answers isn't a legitimate blind judge — it's exactly the kind of look-real-but-isn't number this project's own history already had to retract once (the withdrawn v1-to-v1.2 comparison). So this session asked Brandon directly which path to take; he chose to authorize the Agent tool for a real run now. Using isolated Agent-tool subagents (no awareness of the study, no awareness of which transcript position was baseline/candidate, or of the other variant), this session ran the same methodology `answer-study.mjs` encodes for the first 8 corpus cases (position order randomized via a recorded coin-flip sequence, seed 20260920, decided before any answer was read), saved the real transcripts, and ran them through the actual `aggregate()`/`writeEvaluationSnapshot()` code via `--aggregate --write` — not a hand-computed shortcut.

**Result (8/26 cases, one run per variant):**
- `visibleAnswerTokens`: 4,534 → 4,521 (−0.3%); `visibleAnswerWords`: 3,013 → 3,009 (−0.1%).
- `blindJudge`: baseline 7/8 accepted, candidate 5/8, 1 hard defect (candidate's answer on the Node.js version-research case named an incorrect LTS codename).
- `strictJudge`: baseline 2/8 accepted, candidate 1/8 (both variants are heavily uncertainty-hedged answers to abstract tasks with no attached repository, which a strict "no further clarification needed" bar penalizes); head-to-head preference: candidate 4 wins, 3 losses, 1 tie.
- `provenance.modelAnswerSample`: `reproducible: true`, `runsPerVariant: 1`, `sourceArtifactsRetained: true`.

`mcp/dashboard-test.mjs` and `mcp/smoke.mjs` previously asserted `modelAnswerSample.reproducible === false`; both are updated to assert `true` and to check the new sample-size fields, since asserting the old placeholder would now be asserting a falsehood.

## Validation and evidence

`bun run build` (all suites including the new `mcp:answer-study-test`, `astro check`, `astro build`) passed with 0 errors. `mcp:dashboard-test` 41 checks. Local Worker screenshot of the signed-in overview confirms every previously-"Not measured" field now shows real values and the "Answer-quality study not re-run" bell notice correctly disappeared (`blindJudge.possible` is no longer 0). Not verified: production deployment, CI's `answer-study.yml` (inert without a secret — untestable until one is added), and the full 26-case corpus (only 8 were run).

## Rollback

`git checkout -- mcp/README.md mcp/dashboard-test.mjs mcp/evaluation.ts mcp/policy-eval.mjs mcp/smoke.mjs package.json .github/workflows/ci.yml` and delete `mcp/answer-study.mjs`, `mcp/answer-study-test.mjs`, `mcp/corpus.mjs`, `.github/workflows/answer-study.yml`, `mcp/assessments/answer-study/`.

## Drift and follow-up

- This is an 8-case directional sample with a non-pinned judge model, not the full 26-case corpus against a fixed provider model. Treat `candidateWins`/`candidateLosses` as suggestive.
- The CI pipeline needs `ANTHROPIC_API_KEY` added as a repository secret (and optionally `ANSWER_STUDY_CASES` as a repository variable) before it does anything; until then `answer-study.yml` runs and exits as a no-op on every push to `main`.
- A fixed entry-point bug in `answer-study.mjs` (the `import.meta.url === file://${process.argv[1]}` guard silently failed on Windows path separators) was found and fixed with `pathToFileURL` during this same change — worth a Linux-runner smoke test in CI before trusting it fully, since it was only exercised on Windows here.
