import { readFile } from "node:fs/promises";
import { baselineCommit, baselinePolicies, selectBaselineCategoryIds } from "./policy-baseline.mjs";
import { evaluationSnapshot } from "./evaluation.ts";
import { categoryDefinitions, selectRelevantCategoryIds } from "./routing.ts";

const cases = [
  { name: "small implementation", input: { task: "Implement the smallest safe code change and test it" } },
  { name: "architecture decision", input: { task: "Explain the architecture tradeoffs before changing this service" } },
  { name: "JavaScript exception", input: { task: "Debug this JavaScript exception and fix the root cause" } },
  { name: ".NET nullable bug", input: { task: "Fix a nullable C# bug in this .NET service" } },
  { name: "SQL migration", input: { task: "Implement and verify a SQL schema migration" } },
  {
    name: "EF Core timeout",
    input: { task: "Investigate an EF Core query timeout" },
    allowPayloadGrowth: "v1 missed the debugging, .NET, and SQL categories",
  },
  { name: "version research", input: { task: "Research the latest supported Node.js version using official documentation" } },
  { name: "release notes", input: { task: "Summarize the current release notes and cite the official source" } },
  { name: "pull request review", input: { task: "Review this pull request for regressions and missing tests" } },
  { name: "security review", input: { task: "Perform a code review for security risks" } },
  { name: "mixed review", input: { task: "Review and debug a .NET SQL database migration error" } },
  { name: "project overview", input: { task: "Prepare a project overview" } },
  { name: "React GraphQL", input: { task: "Implement a React view for this GraphQL query" } },
  { name: "current source file", input: { task: "Change the current source file" } },
  { name: "concise explanation", input: { task: "Explain this unfamiliar concept concisely" } },
  { name: "deployment failure", input: { task: "Troubleshoot the deployment failures and verify the fix" } },
  { name: "database dependencies", input: { task: "Change a database stored procedure without breaking dependent ETL" } },
  { name: "API specification", input: { task: "Look up the current API specification and recommend an approach" } },
  { name: "PR campaign", input: { task: "Implement a PR campaign dashboard" } },
  { name: "AWS migration", input: { task: "Plan an AWS migration" } },
  { name: "regression model", input: { task: "Evaluate this regression model" } },
  { name: "explicit research", input: { task: "Evaluate this choice", categories: ["research"] } },
  { name: "explicit audit mix", input: { task: "Audit these policies", categories: ["debugging", "dotnet", "sql", "research", "code-review"] } },
];

const currentPolicies = Object.fromEntries(
  await Promise.all(
    categoryDefinitions.map(async ({ id }) => [
      id,
      (await readFile(new URL(`./preferences/${id}.md`, import.meta.url), "utf8")).trim(),
    ])
  )
);

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
];

const newRequiredRules = [
  ["TL;DR", /TL;DR:/],
  ["reasoning budget", /reasoning\/context/],
  ["compaction persistence", /through compaction/],
  ["stopping condition", /Stop at diminishing returns/],
  ["authority boundary", /analysis\/review: read-only/i],
  ["official documentation", /official owner docs/],
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
  baselineQuality: 0,
  currentQuality: 0,
  possibleQuality: 0,
};
const results = [];
const largerCases = [];
const largerGuidanceCases = [];
const tokenPayloads = [];

for (const testCase of cases) {
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
  totals.currentBytes <= totals.baselineBytes,
  `aggregate serialized results grew from ${totals.baselineBytes} to ${totals.currentBytes} bytes`
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
    smallerCases: cases.length - largerCases.length,
    largerCases,
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

function formatGuidance(ids, policies) {
  return ids.map((id) => policies[id].trim()).join("\n\n---\n\n");
}

function toolResult(categories, guidance, duplicateGuidance) {
  return {
    content: [{ type: "text", text: guidance }],
    structuredContent: duplicateGuidance ? { categories, guidance } : { categories },
  };
}

function wordCount(value) {
  return value.match(/[A-Za-z0-9_.#-]+/g)?.length ?? 0;
}

function percentChange(before, after) {
  return Number((((after - before) / before) * 100).toFixed(1));
}

function assert(condition, message) {
  if (!condition) throw new Error(`MCP policy evaluation failed: ${message}`);
}
