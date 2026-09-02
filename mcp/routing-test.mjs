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
    name: "debugging inflection",
    input: { task: "Debugging strange behavior" },
    expected: ["global", "communication", "engineering", "debugging"],
  },
  {
    name: "reviewing inflection",
    input: { task: "Reviewing this implementation" },
    expected: ["global", "communication", "engineering", "code-review"],
  },
  {
    name: "release notes plural",
    input: { task: "Summarize the release notes" },
    expected: ["global", "communication", "engineering", "research"],
  },
  {
    name: "code review phrases",
    input: { task: "Review this pull request for regression risk" },
    expected: ["global", "communication", "engineering", "code-review"],
  },
  {
    name: "mixed review keeps task mode and domains",
    input: { task: "Review a .NET SQL database migration error" },
    expected: ["global", "communication", "engineering", "debugging", "code-review", "sql", "dotnet"],
  },
  {
    name: "EF Core timeout",
    input: { task: "Investigate an EF Core query timeout" },
    expected: ["global", "communication", "engineering", "debugging", "dotnet", "sql"],
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
  "engineering",
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
assert(explicit.length === 8, "explicit category requests are not capped");

const [globalPolicy, communicationPolicy] = await Promise.all([
  readFile(new URL("./preferences/global.md", import.meta.url), "utf8"),
  readFile(new URL("./preferences/communication.md", import.meta.url), "utf8"),
]);
assert(communicationPolicy.includes("TL;DR:"), "baseline guidance includes the TL;DR rule");
assert(
  communicationPolicy.includes("visible answer concise"),
  "concise presentation does not cap investigation"
);
assert(globalPolicy.includes("reasoning and context budget"), "baseline guidance spends the token budget on useful work");
assert(globalPolicy.includes("context compaction"), "baseline guidance persists across context compaction");
assert(globalPolicy.includes("analysis or review is read-only"), "baseline guidance respects the requested authority boundary");
assert(globalPolicy.includes("Stop when further work"), "baseline guidance defines a stopping condition");
assert(globalPolicy.includes("official documentation"), "baseline guidance includes the official-documentation rule");

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
