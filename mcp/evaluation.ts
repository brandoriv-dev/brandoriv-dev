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
  evaluatedAt: "2026-09-23",
  baseline: "v1.5.0 frozen baseline",
  candidate: "single-call policy routing with compact baseline and separate commands",
  corpus: {
    policyCases: 26,
    answerPairs: 8,
    routingChecks: 44,
  },
  serializedResponses: {
    baselineBytes: 257_861,
    candidateBytes: 119_048,
    changePercent: -53.8,
    smallerCases: 25,
    largerCases: 1,
  },
  serializedResultTokens: {
    baseline: 56_618,
    candidate: 23_049,
    changePercent: -59.3,
    tokenizer: "gpt-tokenizer o200k_base",
    scope:
      "Complete JSON-serialized MCP results. Client-visible and provider-billed tokens may differ because clients can project or cache results differently.",
  },
  payloadTrend: [
    { version: "v1.5", label: "Frozen baseline", tokens: 56_618, measuredAt: "2026-09-04", sourceCommit: "7c6af2a" },
    { version: "v1.9", label: "Hierarchical routing", tokens: 26_224, measuredAt: "2026-09-19", sourceCommit: "a2cfe86" },
    { version: "v1.11", label: "Routed design guidance", tokens: 28_353, measuredAt: "2026-09-21", sourceCommit: "c7a2b43" },
    { version: "v1.14", label: "Single-call routing", tokens: 23_049, measuredAt: "2026-09-23", sourceCommit: "f67bbc6" },
  ],
  guidanceText: {
    baselineBytes: 124_080,
    candidateBytes: 56_785,
    changePercent: -54.2,
    largerCases: 1,
    caseCount: 26,
  },
  normalizedSerializedResponses: {
    baselineBytes: 130_584,
    candidateBytes: 60_948,
    changePercent: -53.3,
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
    baseline: 335,
    candidate: 228,
    possible: 377,
    lostBaselineMatches: 107,
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
      reproducible: false,
      runsPerVariant: 1,
      sourceArtifactsRetained: true,
      label: "8-case model-answer sample vs the frozen baseline (claude (agent-tool subagent, isolated per call), one run per variant; bun run mcp:answer-study -- --aggregate 2026-09-20-session-agent-run-1 to re-score the retained transcripts).",
    },
  },
  note:
    "The candidate keeps a compact global and communication baseline, resolves inferred and explicit policies in one call, returns language leaves directly, separates command workflows from policy ids, and leaves unknown tasks at baseline only. Twenty-five cases are smaller; the PR dashboard case grows deliberately because it receives frontend guidance. Regex presence is diagnostic only and is not a compliance or quality score. This is a build-time payload benchmark, not usage or billing telemetry.",
} as const;
