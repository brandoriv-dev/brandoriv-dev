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
  evaluatedAt: "2026-09-10",
  baseline: "v1.5.0 frozen baseline",
  candidate: "v1.5.0 live policy",
  corpus: {
    policyCases: 23,
    answerPairs: 0,
    routingChecks: 26,
  },
  serializedResponses: {
    baselineBytes: 220_998,
    candidateBytes: 220_998,
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
      "Not re-measured after the v1.5.0 re-baseline. Refresh by running a tokenizer over `bun run mcp:policy-eval --payloads`.",
  },
  guidanceText: {
    baselineBytes: 106_204,
    candidateBytes: 106_204,
    changePercent: 0,
    largerCases: 0,
    caseCount: 23,
  },
  normalizedSerializedResponses: {
    baselineBytes: 111_969,
    candidateBytes: 111_969,
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
      label: "Pending re-measurement against the v1.5.0 baseline",
    },
  },
  note:
    "Baseline re-frozen at v1.5.0. unslop was compressed from 4,523 to 2,239 bytes and joined the always-on baseline, and a 430-byte code-style check was added that tells the agent to look up language style rules keyword routing cannot detect. Always-on guidance rose from 826 to 3,445 bytes per call; adding the two categories uncompressed would have cost 12,902.",
} as const;
