import { readFile } from "node:fs/promises";
import { selectRelevantCategoryIds } from "./routing.ts";

const routingCases = [
  {
    name: "substring false positives",
    input: { task: "Prepare a project overview" },
    expected: ["global", "communication", "engineering"],
  },
  {
    name: "React views and GraphQL queries are not SQL",
    input: { task: "Implement a React view for this GraphQL query" },
    expected: ["global", "communication", "engineering"],
  },
  {
    name: "current source file is not research",
    input: { task: "Change the current source file" },
    expected: ["global", "communication", "engineering"],
  },
  {
    name: "communication-only request avoids engineering",
    input: { task: "Explain this unfamiliar concept concisely" },
    expected: ["global", "communication"],
  },
  {
    name: "public relations is not code review",
    input: { task: "Implement a PR campaign dashboard" },
    expected: ["global", "communication", "engineering"],
  },
  {
    name: "cloud migration is not SQL",
    input: { task: "Plan an AWS migration" },
    expected: ["global", "communication", "engineering"],
  },
  {
    name: "statistical regression is not code review",
    input: { task: "Evaluate this regression model" },
    expected: ["global", "communication", "engineering"],
  },
  {
    name: "debugging inflection",
    input: { task: "Debugging strange behavior" },
    expected: ["global", "communication", "debugging"],
  },
  {
    name: "reviewing inflection",
    input: { task: "Reviewing this implementation" },
    expected: ["global", "communication", "code-review"],
  },
  {
    name: "release notes plural",
    input: { task: "Summarize the release notes" },
    expected: ["global", "communication", "research"],
  },
  {
    name: "code review phrases",
    input: { task: "Review this pull request for regression risk" },
    expected: ["global", "communication", "code-review"],
  },
  {
    name: "mixed review keeps task mode and domains",
    input: { task: "Review a .NET SQL database migration error" },
    expected: ["global", "communication", "debugging", "code-review", "sql", "dotnet"],
  },
  {
    name: "EF Core timeout",
    input: { task: "Investigate an EF Core query timeout" },
    expected: ["global", "communication", "debugging", "dotnet", "sql"],
  },
];

for (const testCase of routingCases) {
  const actual = selectRelevantCategoryIds(testCase.input);
  assertEqual(testCase.name, actual, testCase.expected);
}

const dense = selectRelevantCategoryIds({
  task: "Review and debug .NET SQL code using official documentation",
});
assertEqual("dense routing keeps modes and domains", dense, [
  "global",
  "communication",
  "research",
  "debugging",
  "code-review",
  "dotnet",
  "sql",
]);

const explicit = selectRelevantCategoryIds({
  task: "Policy audit",
  categories: ["debugging", "dotnet", "sql", "research", "code-review"],
});
assert(explicit.length === 7, "explicit category requests are not capped");

const [globalPolicy, communicationPolicy] = await Promise.all([
  readFile(new URL("./preferences/global.md", import.meta.url), "utf8"),
  readFile(new URL("./preferences/communication.md", import.meta.url), "utf8"),
]);
assert(communicationPolicy.includes("TL;DR:"), "baseline guidance includes the TL;DR rule");
assert(
  communicationPolicy.includes("concise without limiting work"),
  "concise presentation does not cap investigation"
);
assert(globalPolicy.includes("Spend tokens aggressively"), "baseline guidance spends the token budget on useful work");
assert(globalPolicy.includes("through compaction"), "baseline guidance persists across context compaction");
assert(globalPolicy.toLowerCase().includes("analysis/review: read-only"), "baseline guidance respects the requested authority boundary");
assert(globalPolicy.includes("Stop at diminishing returns"), "baseline guidance defines a stopping condition");
assert(globalPolicy.includes("official owner docs"), "baseline guidance includes the official-documentation rule");

console.log(`MCP routing tests passed (${routingCases.length + 9} checks).`);

function assertEqual(name, actual, expected) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${name}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(`MCP routing test failed: ${message}`);
}
