import { readFile } from "node:fs/promises";
import { countTokens } from "gpt-tokenizer";
import { cases, legacyCaseCount, formatGuidance, wordCount, percentChange } from "./corpus.mjs";
import { baselineCommit, baselinePolicies, selectBaselineCategoryIds } from "./policy-baseline.mjs";
import { evaluationSnapshot } from "./evaluation.ts";
import { categoryDefinitions, selectRelevantCategoryIds } from "./routing.ts";
import { bootstrapInstruction } from "./service.ts";


const currentPolicies = Object.fromEntries(
  await Promise.all(
    categoryDefinitions.map(async ({ id }) => [
      id,
      (await readFile(new URL(`./preferences/${id}.md`, import.meta.url), "utf8")).trim(),
    ])
  )
);
const currentServerInstructions = `${bootstrapInstruction}\n\n---\n\n${formatGuidance(
  ["global", "communication", "unslop", "code-style"],
  currentPolicies
)}`;

const rules = [
  { id: "simple-scope", pattern: /simple solution|smallest (?:simple|safe) (?:solution|change)/i },
  { id: "existing-system", pattern: /existing (?:code|architecture|implementations)/i },
  { id: "tradeoffs", pattern: /tradeoffs?/i },
  { id: "challenge-assumptions", pattern: /challenge (?:my )?assumptions/i },
  { id: "complete-work", pattern: /completing a task|persist.*until complete/is },
  { id: "concise-output", pattern: /\bconcise\b/i },
  { id: "explain-unfamiliar", pattern: /explain unfamiliar concepts? simply/i },
  { id: "avoid-obvious-syntax", pattern: /obvious syntax/i },
  { id: "epistemic-labels", pattern: /facts?.*assumptions?.*recommendations?/is },
  { id: "unlabeled-claims", pattern: /Unlabeled statements read as verified fact/i },
  { id: "final-message-discipline", pattern: /last message as much as the first/i },
  { id: "adaptive-depth", pattern: /go deeper when|hard (?:tasks?|or (?:quality-)?critical)/i },
  { id: "tests-and-impact", pattern: /test every known downstream app|tests prove the fix/i, categories: ["engineering", "debugging"] },
  { id: "contract-docs", pattern: /update the README\/runbook/i, categories: ["engineering"] },
  { id: "downstream-consumers", pattern: /test every known downstream app/i, categories: ["engineering"] },
  { id: "small-safe-change", pattern: /smallest safe (?:change|fix)/i, categories: ["engineering", "debugging"] },
  { id: "root-cause", pattern: /root cause/i, categories: ["debugging"] },
  { id: "prove-fix", pattern: /tests prove the fix/i, categories: ["debugging"] },
  { id: "actual-schema", pattern: /actual schema/i, categories: ["sql"] },
  { id: "non-destructive", pattern: /non-destructively/i, categories: ["sql"] },
  { id: "modern-dotnet", pattern: /modern supported \.NET APIs/i, categories: ["dotnet"] },
  { id: "nullable", pattern: /nullable-reference-type/i, categories: ["dotnet"] },
  { id: "official-primary", pattern: /official (?:owner )?(?:documentation|sources)|current primary sources/i, categories: ["research"] },
  { id: "source-fallback", pattern: /source (?:code|repositories)|source\/tests|maintainer(?: material|s)/i, categories: ["research"] },
  { id: "severity-review", pattern: /findings ordered by severity/i, categories: ["code-review"] },
  { id: "concrete-review-evidence", pattern: /concrete files, lines, behaviors, or reproduction paths/i, categories: ["code-review"] },
  { id: "typed-external-data", pattern: /external data as `unknown`/i, categories: ["typescript-javascript"] },
  { id: "python-project-config", pattern: /`pyproject\.toml`/i, categories: ["python"] },
  { id: "powershell-literal-path", pattern: /`-LiteralPath`/i, categories: ["powershell"] },
  { id: "iac-plan-validation", pattern: /plan or what-if/i, categories: ["infrastructure-as-code"] },
  { id: "frontend-progressive-detail", pattern: /overview first, zoom and filter, then details on demand/i, categories: ["frontend-design"] },
  { id: "frontend-neutral-surfaces", pattern: /neutral surfaces by default/i, categories: ["frontend-design"] },
  { id: "frontend-chart-purpose", pattern: /Select the chart from the question/i, categories: ["frontend-design"] },
  { id: "frontend-reskin-test", pattern: /run a reskin test/i, categories: ["frontend-design"] },
];

const newRequiredRules = [
  ["TL;DR", /TL;DR:/],
  ["reasoning budget", /reasoning\/context/],
  ["compaction persistence", /through compaction/],
  ["stopping condition", /Stop at diminishing returns/],
  ["authority boundary", /analysis\/review: read-only/i],
  ["official documentation", /official owner docs/],
  ["epistemic label format", /`Fact:`[\s\S]*`Recommendation:`/],
];

const totals = {
  baselineBytes: 0,
  currentBytes: 0,
  baselineNormalizedBytes: 0,
  currentNormalizedBytes: 0,
  baselineGuidanceBytes: 0,
  currentGuidanceBytes: 0,
  baselineWords: 0,
  currentWords: 0,
  baselineTokens: 0,
  currentTokens: 0,
  legacyBaselineTokens: 0,
  legacyCurrentTokens: 0,
  baselineQuality: 0,
  currentQuality: 0,
  possibleQuality: 0,
};
const results = [];
const largerCases = [];
const smallerCases = [];
const largerGuidanceCases = [];
const tokenPayloads = [];

for (const [caseIndex, testCase] of cases.entries()) {
  const baselineCategories = selectBaselineCategoryIds(testCase.input);
  const currentCategories = selectRelevantCategoryIds(testCase.input);
  const baselineGuidance = formatGuidance(baselineCategories, baselinePolicies);
  const currentGuidance = formatGuidance(currentCategories, currentPolicies);
  const baselineResult = toolResult(baselineCategories, baselineGuidance, true);
  const currentResult = toolResult(currentCategories, currentGuidance, true);
  const applicableRules = rules.filter(
    ({ categories }) => !categories || categories.some((category) => currentCategories.includes(category))
  );
  const baselineCoverage = applicableRules.filter(({ pattern }) => pattern.test(baselineGuidance)).map(({ id }) => id);
  const currentCoverage = applicableRules.filter(({ pattern }) => pattern.test(currentGuidance)).map(({ id }) => id);
  const lostRules = baselineCoverage.filter((id) => !currentCoverage.includes(id));
  const missingRules = applicableRules.map(({ id }) => id).filter((id) => !currentCoverage.includes(id));
  const baselineSerialized = JSON.stringify(baselineResult);
  const currentSerialized = JSON.stringify(currentResult);
  const baselineNormalizedSerialized = JSON.stringify(toolResult(baselineCategories, baselineGuidance, false));
  const baselineBytes = Buffer.byteLength(baselineSerialized);
  const currentBytes = Buffer.byteLength(currentSerialized);
  const baselineGuidanceBytes = Buffer.byteLength(baselineGuidance);
  const currentGuidanceBytes = Buffer.byteLength(currentGuidance);

  assert(lostRules.length === 0, `${testCase.name}: lost baseline rules ${lostRules.join(", ")}`);
  assert(missingRules.length === 0, `${testCase.name}: missing required rules ${missingRules.join(", ")}`);
  if (currentBytes > baselineBytes) {
    assert(
      testCase.allowPayloadGrowth && currentCoverage.length > baselineCoverage.length,
      `${testCase.name}: unexplained serialized growth from ${baselineBytes} to ${currentBytes} bytes`
    );
    largerCases.push({
      case: testCase.name,
      baselineBytes,
      currentBytes,
      reason: testCase.allowPayloadGrowth,
      patternMatchGain: currentCoverage.length - baselineCoverage.length,
    });
  }
  if (currentBytes < baselineBytes) smallerCases.push(testCase.name);

  const baselineWords = wordCount(JSON.stringify(baselineResult));
  const currentWords = wordCount(JSON.stringify(currentResult));
  totals.baselineBytes += baselineBytes;
  totals.currentBytes += currentBytes;
  totals.baselineNormalizedBytes += Buffer.byteLength(baselineNormalizedSerialized);
  totals.currentNormalizedBytes += Buffer.byteLength(
    JSON.stringify(toolResult(currentCategories, currentGuidance, false))
  );
  totals.baselineGuidanceBytes += baselineGuidanceBytes;
  totals.currentGuidanceBytes += currentGuidanceBytes;
  totals.baselineWords += baselineWords;
  totals.currentWords += currentWords;
  const baselineTokens = countTokens(baselineSerialized);
  const currentTokens = countTokens(currentSerialized);
  totals.baselineTokens += baselineTokens;
  totals.currentTokens += currentTokens;
  if (caseIndex < legacyCaseCount) {
    totals.legacyBaselineTokens += baselineTokens;
    totals.legacyCurrentTokens += currentTokens;
  }
  totals.baselineQuality += baselineCoverage.length;
  totals.currentQuality += currentCoverage.length;
  totals.possibleQuality += applicableRules.length;
  if (currentGuidanceBytes > baselineGuidanceBytes) largerGuidanceCases.push(testCase.name);
  tokenPayloads.push({ case: testCase.name, baseline: baselineSerialized, current: currentSerialized });
  results.push({
    case: testCase.name,
    baselineCategories,
    currentCategories,
    bytes: { baseline: baselineBytes, current: currentBytes, changePercent: percentChange(baselineBytes, currentBytes) },
    patternMatches: { baseline: baselineCoverage.length, current: currentCoverage.length, possible: applicableRules.length },
  });
}

const baselineText = Object.values(baselinePolicies).join("\n");
const currentText = Object.values(currentPolicies).join("\n");
for (const [name, pattern] of newRequiredRules) {
  assert(pattern.test(currentText), `current policy is missing ${name}`);
}
assert(
  largerCases.every(({ patternMatchGain }) => patternMatchGain > 0),
  "payload growth must be paired with new route-applicable policy coverage"
);

const report = {
  ok: true,
  baselineCommit,
  caseCount: cases.length,
  serializedToolResults: {
    metric: "Exact UTF-8 bytes and lexical words in JSON-serialized MCP tool results",
    baselineBytes: totals.baselineBytes,
    currentBytes: totals.currentBytes,
    byteChangePercent: percentChange(totals.baselineBytes, totals.currentBytes),
    baselineWords: totals.baselineWords,
    currentWords: totals.currentWords,
    wordChangePercent: percentChange(totals.baselineWords, totals.currentWords),
    smallerCases,
    largerCases,
  },
  serializedResultTokens: {
    metric: "o200k_base tokens in JSON-serialized MCP tool results; client-visible and billed tokens may differ",
    encoding: "o200k_base",
    baseline: totals.baselineTokens,
    current: totals.currentTokens,
    changePercent: percentChange(totals.baselineTokens, totals.currentTokens),
    averageCurrentPerCase: Math.round(totals.currentTokens / cases.length),
    originalCorpus: {
      cases: legacyCaseCount,
      baseline: totals.legacyBaselineTokens,
      current: totals.legacyCurrentTokens,
      changePercent: percentChange(totals.legacyBaselineTokens, totals.legacyCurrentTokens),
    },
  },
  initializationInstructions: {
    metric: "Current MCP initialize instructions; normally paid once per connection/session and potentially cacheable",
    bytes: Buffer.byteLength(currentServerInstructions),
    tokens: countTokens(currentServerInstructions),
    encoding: "o200k_base",
  },
  normalizedSerializedToolResults: {
    metric: "Exact UTF-8 bytes after omitting duplicated guidance from structuredContent in both variants",
    baselineBytes: totals.baselineNormalizedBytes,
    currentBytes: totals.currentNormalizedBytes,
    byteChangePercent: percentChange(totals.baselineNormalizedBytes, totals.currentNormalizedBytes),
  },
  guidanceText: {
    metric: "Exact UTF-8 bytes in content[0].text",
    baselineBytes: totals.baselineGuidanceBytes,
    currentBytes: totals.currentGuidanceBytes,
    byteChangePercent: percentChange(totals.baselineGuidanceBytes, totals.currentGuidanceBytes),
    largerCases: largerGuidanceCases,
  },
  policyPatternChecks: {
    metric: "Route-applicable regex-presence incidences across the deterministic corpus",
    baseline: `${totals.baselineQuality}/${totals.possibleQuality}`,
    current: `${totals.currentQuality}/${totals.possibleQuality}`,
    lostBaselineMatches: 0,
  },
  cases: results,
};

if (process.argv.includes("--print-report")) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}
assert(evaluationSnapshot.corpus.policyCases === report.caseCount, "dashboard policy case count is stale");
assert(
  evaluationSnapshot.serializedResponses.baselineBytes === report.serializedToolResults.baselineBytes,
  "dashboard baseline byte count is stale"
);
assert(
  evaluationSnapshot.serializedResponses.candidateBytes === report.serializedToolResults.currentBytes,
  "dashboard candidate byte count is stale"
);
assert(
  evaluationSnapshot.serializedResponses.changePercent === report.serializedToolResults.byteChangePercent,
  "dashboard byte reduction is stale"
);
assert(
  evaluationSnapshot.serializedResultTokens.baseline === report.serializedResultTokens.baseline &&
    evaluationSnapshot.serializedResultTokens.candidate === report.serializedResultTokens.current &&
    evaluationSnapshot.serializedResultTokens.changePercent === report.serializedResultTokens.changePercent,
  "dashboard serialized-result token measurement is stale"
);
assert(
  evaluationSnapshot.normalizedSerializedResponses.baselineBytes ===
    report.normalizedSerializedToolResults.baselineBytes,
  "dashboard normalized baseline byte count is stale"
);
assert(
  evaluationSnapshot.normalizedSerializedResponses.changePercent ===
    report.normalizedSerializedToolResults.byteChangePercent,
  "dashboard normalized byte change is stale"
);
assert(
  evaluationSnapshot.guidanceText.baselineBytes === report.guidanceText.baselineBytes &&
    evaluationSnapshot.guidanceText.candidateBytes === report.guidanceText.currentBytes &&
    evaluationSnapshot.guidanceText.changePercent === report.guidanceText.byteChangePercent &&
    evaluationSnapshot.guidanceText.largerCases === report.guidanceText.largerCases.length,
  "dashboard guidance-text measurement is stale"
);
assert(
  `${evaluationSnapshot.policyPatternChecks.baseline}/${evaluationSnapshot.policyPatternChecks.possible}` ===
    report.policyPatternChecks.baseline,
  "dashboard baseline policy pattern count is stale"
);
assert(
  `${evaluationSnapshot.policyPatternChecks.candidate}/${evaluationSnapshot.policyPatternChecks.possible}` ===
    report.policyPatternChecks.current,
  "dashboard candidate policy pattern count is stale"
);
assert(
  evaluationSnapshot.policyPatternChecks.lostBaselineMatches === report.policyPatternChecks.lostBaselineMatches,
  "dashboard lost-pattern count is stale"
);

console.log(
  process.argv.includes("--payloads")
    ? JSON.stringify(tokenPayloads)
    : JSON.stringify(report, null, 2)
);


function toolResult(categories, guidance, duplicateGuidance) {
  return {
    content: [{ type: "text", text: guidance }],
    structuredContent: duplicateGuidance ? { categories, guidance } : { categories },
  };
}



function assert(condition, message) {
  if (!condition) throw new Error(`MCP policy evaluation failed: ${message}`);
}
