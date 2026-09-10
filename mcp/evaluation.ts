// Re-baselined on 2026-09-04. The v1-to-v1.2 comparison this file used to publish
// described a policy that shipped a guidance blackout: structuredContent carried
// only category ids, so clients that surface structured output received an empty
// policy while every check still reported success. Those figures are withdrawn.
//
// The deterministic figures below are the current re-baseline, where the frozen
// baseline and the live policy are the same artifact, so every comparison is zero
// by construction. The comparative model-answer study has not been re-run; its
// fields are explicitly zeroed rather than carried over, and are labelled pending.
export const evaluationSnapshot = {
  evaluatedAt: "2026-09-04",
  baseline: "v1.4.0 frozen baseline",
  candidate: "v1.4.0 live policy",
  corpus: {
    policyCases: 23,
    answerPairs: 0,
    routingChecks: 22,
  },
  serializedResponses: {
    baselineBytes: 96_068,
    candidateBytes: 96_068,
    changePercent: 0,
    smallerCases: 23,
    largerCases: 0,
  },
  serializedResultTokens: {
    baseline: 0,
    candidate: 0,
    changePercent: 0,
    tokenizer: "Not re-measured",
    scope:
      "Not re-measured after the v1.4.0 re-baseline. Refresh by running a tokenizer over `bun run mcp:policy-eval --payloads`.",
  },
  guidanceText: {
    baselineBytes: 45_537,
    candidateBytes: 45_537,
    changePercent: 0,
    largerCases: 0,
    caseCount: 23,
  },
  normalizedSerializedResponses: {
    baselineBytes: 49_251,
    candidateBytes: 49_251,
    changePercent: 0,
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
    baseline: 312,
    candidate: 312,
    possible: 312,
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
      label: "Pending re-measurement against the v1.4.0 baseline",
    },
  },
  note:
    "Baseline re-frozen at v1.4.0 after adding C# style and Unslop preferences, so deterministic deltas are zero by construction. The previous v1-to-v1.2 reduction is withdrawn: it measured a payload that omitted the guidance clients actually read. Model-answer quality has not been re-measured.",
} as const;
