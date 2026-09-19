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
  evaluatedAt: "2026-09-19",
  baseline: "v1.5.0 frozen baseline",
  candidate: "hierarchical progressive disclosure with routed frontend design guidance",
  corpus: {
    policyCases: 26,
    answerPairs: 0,
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
    baseline: 0,
    candidate: 0,
    changePercent: 0,
  },
  visibleAnswerWords: {
    baseline: 0,
    candidate: 0,
    changePercent: 0,
  },
  policyPatternChecks: {
    baseline: 338,
    candidate: 383,
    possible: 383,
    lostBaselineMatches: 0,
  },
  blindJudge: {
    baseline: 0,
    candidate: 0,
    possible: 0,
    hardDefects: 0,
  },
  strictJudge: {
    baselineAccepted: 0,
    candidateAccepted: 0,
    possible: 0,
    candidateWins: 0,
    candidateLosses: 0,
    ties: 0,
  },
  provenance: {
    deterministicPolicyEvaluation: {
      reproducible: true,
      command: "bun run mcp:policy-eval",
    },
    modelAnswerSample: {
      reproducible: false,
      runsPerVariant: 0,
      sourceArtifactsRetained: false,
      label: "Pending model-output measurement against the v1.5.0 baseline",
    },
  },
  note:
    "The candidate keeps only global and communication guidance always on, then routes workflow, code-style, language, writing, and frontend-design policies on demand. Twenty-five cases are smaller; the PR dashboard case grows deliberately because it now receives frontend guidance. Deterministic coverage remains complete. This is a build-time payload benchmark, not usage or billing telemetry.",
} as const;
