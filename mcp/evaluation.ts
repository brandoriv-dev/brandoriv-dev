// The frozen v1.5 baseline is retained so routing changes remain measurable.
//
// The v1-to-v1.2 comparison this file once published is withdrawn: it described a
// policy that shipped a guidance blackout, where structuredContent carried only
// category ids and clients surfacing structured output received an empty policy.
//
// Token counts below are deterministic o200k_base counts of complete serialized MCP
// results. They are not provider billing records: clients can project or cache MCP
// content differently. The comparative model-answer study has not been re-run.
export const evaluationSnapshot = {
  evaluatedAt: "2026-09-22",
  baseline: "v1.5.0 frozen baseline",
  candidate: "hierarchical progressive disclosure with routed frontend design guidance and an enforceable communication baseline",
  corpus: {
    policyCases: 26,
    answerPairs: 8,
    routingChecks: 46,
  },
  serializedResponses: {
    baselineBytes: 257_861,
    candidateBytes: 162_026,
    changePercent: -37.2,
    smallerCases: 25,
    largerCases: 1,
  },
  serializedResultTokens: {
    baseline: 56_618,
    candidate: 33_813,
    changePercent: -40.3,
    tokenizer: "gpt-tokenizer o200k_base",
    scope:
      "Complete JSON-serialized MCP results. Client-visible and provider-billed tokens may differ because clients can project or cache results differently.",
  },
  guidanceText: {
    baselineBytes: 124_080,
    candidateBytes: 77_791,
    changePercent: -37.3,
    largerCases: 1,
    caseCount: 26,
  },
  normalizedSerializedResponses: {
    baselineBytes: 130_584,
    candidateBytes: 82_554,
    changePercent: -36.8,
    normalization: "Both variants omit duplicated guidance from structuredContent",
  },
  communicationCompliance: {
    baseline: 14,
    candidate: 13,
    baselinePossible: 24,
    candidatePossible: 24,
    rules: 3,
    scope: "Deterministic regex observance of the stated communication rules in the retained answers, not a quality judgment. Rules that do not apply to an answer are excluded from its denominator.",
  },
  visibleAnswerTokens: {
    baseline: 4534,
    candidate: 4521,
    changePercent: -0.3,
  },
  visibleAnswerWords: {
    baseline: 3013,
    candidate: 3009,
    changePercent: -0.1,
  },
  policyPatternChecks: {
    baseline: 338,
    candidate: 435,
    possible: 435,
    lostBaselineMatches: 0,
  },
  blindJudge: {
    baseline: 7,
    candidate: 5,
    possible: 8,
    hardDefects: 1,
  },
  strictJudge: {
    baselineAccepted: 2,
    candidateAccepted: 1,
    possible: 8,
    candidateWins: 4,
    candidateLosses: 3,
    ties: 1,
  },
  provenance: {
    deterministicPolicyEvaluation: {
      reproducible: true,
      command: "bun run mcp:policy-eval",
    },
    modelAnswerSample: {
      reproducible: true,
      runsPerVariant: 1,
      sourceArtifactsRetained: true,
      label: "8-case model-answer sample vs the frozen baseline (claude (agent-tool subagent, isolated per call), one run per variant; bun run mcp:answer-study -- --aggregate 2026-09-20-session-agent-run-1 to re-score the retained transcripts).",
    },
  },
  note:
    "The candidate keeps only global and communication guidance always on, then routes workflow, code-style, language, writing, and frontend-design policies on demand. Twenty-five cases are smaller; the PR dashboard case grows deliberately because it now receives frontend guidance. Deterministic coverage remains complete. This is a build-time payload benchmark, not usage or billing telemetry. The byte and token reductions moved from -46.9% and -49.9% to the figures above when the communication baseline was rewritten from compressed notes into checkable rules: it carries the labeling trigger, the label format, and the end-of-session restatement, and it is always on, so its roughly 480 added bytes are paid by every case. The blind and strict judge scores below predate that rewrite and describe the earlier communication text. So does communicationCompliance, and that is the point of recording it: scored over the retained 8-case run, the pre-rewrite communication policy was observed in 13 of 24 applicable rule checks, one fewer than the verbose v1.5 baseline it replaced, and the TL;DR opener was observed zero times in eight answers that each ran 12 to 24 sentences. Delivering a rule and having it followed are different measurements, and only the first was being gated.",
} as const;
