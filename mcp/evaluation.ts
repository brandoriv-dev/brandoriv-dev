// Re-baselined on 2026-09-10 at v1.5.0, when unslop and code-style moved into the
// always-on baseline. The frozen baseline and the live policy are the same artifact,
// so every deterministic comparison is zero by construction.
//
// The v1-to-v1.2 comparison this file once published is withdrawn: it described a
// policy that shipped a guidance blackout, where structuredContent carried only
// category ids and clients surfacing structured output received an empty policy.
//
// The comparative model-answer study has not been re-run. Its fields are explicitly
// zeroed rather than carried over, and the dashboard renders them as "Not measured".
export const evaluationSnapshot = {
  evaluatedAt: "2026-09-14",
  baseline: "v1.5.0 frozen baseline",
  candidate: "v1.5.0 live policy",
  corpus: {
    policyCases: 23,
    answerPairs: 0,
    routingChecks: 29,
  },
  serializedResponses: {
    baselineBytes: 232_682,
    candidateBytes: 232_550,
    changePercent: -0.1,
    smallerCases: 23,
    largerCases: 0,
  },
  serializedResultTokens: {
    baseline: 0,
    candidate: 0,
    changePercent: 0,
    tokenizer: "Not re-measured",
    scope:
      "Not re-measured after the v1.5.0 re-baseline. Refresh by running a tokenizer over `bun run mcp:policy-eval --payloads`.",
  },
  guidanceText: {
    baselineBytes: 112_000,
    candidateBytes: 111_956,
    changePercent: 0,
    largerCases: 0,
    caseCount: 23,
  },
  normalizedSerializedResponses: {
    baselineBytes: 117_811,
    candidateBytes: 117_745,
    changePercent: -0.1,
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
    baseline: 301,
    candidate: 334,
    possible: 334,
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
      label: "Pending re-measurement against the v1.5.0 baseline",
    },
  },
  note:
    "Against the frozen v1.5.0 baseline, engineering guidance now requires shared-contract documentation and downstream tests while making the engineering category 12 serialized bytes smaller per applicable response. The comparative model-answer study remains pending.",
} as const;
