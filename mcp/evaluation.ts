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
  evaluatedAt: "2026-09-21",
  baseline: "v1.5.0 frozen baseline",
  candidate: "hierarchical progressive disclosure with routed frontend design guidance",
  corpus: {
    policyCases: 26,
    answerPairs: 8,
    routingChecks: 40,
  },
  serializedResponses: {
    baselineBytes: 257_861,
    candidateBytes: 136_858,
    changePercent: -46.9,
    smallerCases: 25,
    largerCases: 1,
  },
  serializedResultTokens: {
    baseline: 56_618,
    candidate: 28_353,
    changePercent: -49.9,
    tokenizer: "gpt-tokenizer o200k_base",
    scope:
      "Complete JSON-serialized MCP results. Client-visible and provider-billed tokens may differ because clients can project or cache results differently.",
  },
  guidanceText: {
    baselineBytes: 124_080,
    candidateBytes: 65_285,
    changePercent: -47.4,
    largerCases: 1,
    caseCount: 26,
  },
  normalizedSerializedResponses: {
    baselineBytes: 130_584,
    candidateBytes: 69_970,
    changePercent: -46.4,
    normalization: "Both variants omit duplicated guidance from structuredContent",
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
    candidate: 383,
    possible: 383,
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
    "The candidate keeps only global and communication guidance always on, then routes workflow, code-style, language, writing, and frontend-design policies on demand. Twenty-five cases are smaller; the PR dashboard case grows deliberately because it now receives frontend guidance. Deterministic coverage remains complete. This is a build-time payload benchmark, not usage or billing telemetry.",
} as const;
