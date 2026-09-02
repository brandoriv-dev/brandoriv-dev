import { readFile } from "node:fs/promises";
import { baselineCategoryDefinitions, baselineCommit, baselinePolicies } from "./policy-baseline.mjs";
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
  { id: "tests-and-impact", pattern: /tests? and downstream impact|tests prove the fix/i, categories: ["engineering", "debugging"] },
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
  baselineWords: 0,
  currentWords: 0,
  baselineQuality: 0,
  currentQuality: 0,
  possibleQuality: 0,
};
const results = [];
const largerCases = [];
const tokenPayloads = [];

for (const testCase of cases) {
  const baselineCategories = selectBaselineCategories(testCase.input);
  const currentCategories = selectRelevantCategoryIds(testCase.input);
  const baselineGuidance = formatGuidance(baselineCategories, baselinePolicies);
  const currentGuidance = formatGuidance(currentCategories, currentPolicies);
  const baselineResult = toolResult(baselineCategories, baselineGuidance, true);
  const currentResult = toolResult(currentCategories, currentGuidance, false);
  const applicableRules = rules.filter(
    ({ categories }) => !categories || categories.some((category) => currentCategories.includes(category))
  );
  const baselineCoverage = applicableRules.filter(({ pattern }) => pattern.test(baselineGuidance)).map(({ id }) => id);
  const currentCoverage = applicableRules.filter(({ pattern }) => pattern.test(currentGuidance)).map(({ id }) => id);
  const lostRules = baselineCoverage.filter((id) => !currentCoverage.includes(id));
  const missingRules = applicableRules.map(({ id }) => id).filter((id) => !currentCoverage.includes(id));
  const baselineSerialized = JSON.stringify(baselineResult);
  const currentSerialized = JSON.stringify(currentResult);
  const baselineBytes = Buffer.byteLength(baselineSerialized);
  const currentBytes = Buffer.byteLength(currentSerialized);

  assert(lostRules.length === 0, `${testCase.name}: lost baseline rules ${lostRules.join(", ")}`);
  assert(missingRules.length === 0, `${testCase.name}: missing required rules ${missingRules.join(", ")}`);
  if (currentBytes >= baselineBytes) {
    assert(
      testCase.allowPayloadGrowth && currentCoverage.length > baselineCoverage.length,
      `${testCase.name}: unexplained serialized growth from ${baselineBytes} to ${currentBytes} bytes`
    );
    largerCases.push({
      case: testCase.name,
      baselineBytes,
      currentBytes,
      reason: testCase.allowPayloadGrowth,
      qualityRuleGain: currentCoverage.length - baselineCoverage.length,
    });
  }

  const baselineWords = wordCount(JSON.stringify(baselineResult));
  const currentWords = wordCount(JSON.stringify(currentResult));
  totals.baselineBytes += baselineBytes;
  totals.currentBytes += currentBytes;
  totals.baselineWords += baselineWords;
  totals.currentWords += currentWords;
  totals.baselineQuality += baselineCoverage.length;
  totals.currentQuality += currentCoverage.length;
  totals.possibleQuality += applicableRules.length;
  tokenPayloads.push({ case: testCase.name, baseline: baselineSerialized, current: currentSerialized });
  results.push({
    case: testCase.name,
    baselineCategories,
    currentCategories,
    bytes: { baseline: baselineBytes, current: currentBytes, changePercent: percentChange(baselineBytes, currentBytes) },
    qualityRules: { baseline: baselineCoverage.length, current: currentCoverage.length, possible: applicableRules.length },
  });
}

const baselineText = Object.values(baselinePolicies).join("\n");
const currentText = Object.values(currentPolicies).join("\n");
for (const [name, pattern] of newRequiredRules) {
  assert(pattern.test(currentText), `current policy is missing ${name}`);
}
assert(
  totals.currentBytes < totals.baselineBytes,
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
  policyRequirementCoverage: {
    baseline: `${totals.baselineQuality}/${totals.possibleQuality}`,
    current: `${totals.currentQuality}/${totals.possibleQuality}`,
    lostBaselineRules: 0,
  },
  cases: results,
};

console.log(
  process.argv.includes("--payloads")
    ? JSON.stringify(tokenPayloads)
    : JSON.stringify(report, null, 2)
);

function selectBaselineCategories(input) {
  const requested = new Set(input.categories ?? []);
  if (requested.size > 0) {
    return includeBaseline(baselineCategoryDefinitions.filter(({ id }) => requested.has(id)).map(({ id }) => id));
  }

  const text = [input.task, input.language, input.framework].filter(Boolean).join(" ").toLowerCase();
  const selected = baselineCategoryDefinitions
    .filter(({ keywords }) => keywords.some((keyword) => text.includes(keyword.toLowerCase())))
    .map(({ id }) => id);
  return includeBaseline(selected.length > 0 ? selected : ["engineering"]);
}

function includeBaseline(selected) {
  const next = [...selected];
  const ids = new Set(next);
  for (const id of ["communication", "global"]) {
    if (!ids.has(id)) next.unshift(id);
  }
  return next;
}

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
