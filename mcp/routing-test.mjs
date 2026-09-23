import { readFile } from "node:fs/promises";
import { selectRelevantCategoryIds } from "./routing.ts";

const routingCases = [
  {
    name: "substring false positives",
    input: { task: "Prepare a project overview" },
    expected: ["global", "communication"],
  },
  {
    name: "React views and GraphQL queries are not SQL",
    input: { task: "Implement a React view for this GraphQL query" },
    expected: ["global", "communication", "typescript-javascript", "engineering"],
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
    expected: ["global", "communication", "frontend-design", "engineering"],
  },
  {
    name: "cloud migration is not SQL",
    input: { task: "Plan an AWS migration" },
    expected: ["global", "communication"],
  },
  {
    name: "statistical regression is not code review",
    input: { task: "Evaluate this regression model" },
    expected: ["global", "communication"],
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
    expected: ["global", "communication", "debugging", "code-review", "sql", "dotnet", "csharp-style"],
  },
  {
    name: "EF Core timeout",
    input: { task: "Investigate an EF Core query timeout" },
    expected: ["global", "communication", "debugging", "dotnet", "sql"],
  },
  {
    name: "C# style selects explicit readable style",
    input: { task: "Refactor this C# service to make the control flow easier to debug", language: "C#", framework: ".NET" },
    expected: ["global", "communication", "debugging", "dotnet", "csharp-style", "engineering"],
  },
  {
    name: "unslop prose cleanup",
    input: { task: "/unslop this AI-generated project description and make it sound less robotic" },
    expected: ["global", "communication", "unslop"],
  },
  {
    name: "TypeScript framework routing",
    input: { task: "Fix this Astro component", language: "TypeScript", framework: "Astro" },
    expected: ["global", "communication", "typescript-javascript", "engineering"],
  },
  {
    name: "frontend dashboard routing",
    input: { task: "Design and implement a responsive analytics dashboard", language: "TypeScript", framework: "React" },
    expected: ["global", "communication", "frontend-design", "typescript-javascript", "engineering"],
  },
  {
    name: "explicit dashboard default routing",
    input: { task: "/dashboard-default design and implement this function app dashboard" },
    expected: ["global", "communication", "frontend-design", "dashboard-default", "engineering"],
  },
  {
    name: "design-only landing page routing",
    input: { task: "Create the visual direction for a landing page" },
    expected: ["global", "communication", "frontend-design"],
  },
  {
    name: "Python routing",
    input: { task: "Implement the endpoint", language: "Python", framework: "FastAPI" },
    expected: ["global", "communication", "python", "engineering"],
  },
  {
    name: "PowerShell routing",
    input: { task: "Debug this deployment script", language: "PowerShell" },
    expected: ["global", "communication", "debugging", "powershell"],
  },
  {
    name: "infrastructure routing",
    input: { task: "Review this Bicep deployment" },
    expected: ["global", "communication", "code-review", "infrastructure-as-code"],
  },
  {
    name: "explicit grill-me command",
    input: { task: "/grill-me on the purpose of the Harness" },
    expected: ["global", "communication"],
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
  "csharp-style",
  "sql",
]);

const explicit = selectRelevantCategoryIds({
  task: "Policy audit",
  categories: ["debugging", "dotnet", "sql", "research", "code-review"],
});
assert(explicit.length === 7, "explicit category requests are not capped");
const augmented = selectRelevantCategoryIds({
  task: "Implement this TypeScript endpoint",
  language: "TypeScript",
  categories: ["research"],
});
assert(augmented.includes("engineering"), "explicit categories preserve inferred task guidance");
assert(augmented.includes("typescript-javascript"), "explicit categories preserve inferred language guidance");
assert(augmented.includes("research"), "explicit categories add requested guidance");

// Writing cleanup stays explicit; generic code work receives task-mode guidance only.
const proseTask = selectRelevantCategoryIds({ task: "Write the intro section for a blog post" });
assert(!proseTask.includes("unslop"), "unslop does not tax ordinary prose without an explicit trigger");
const untaggedCode = selectRelevantCategoryIds({ task: "Fix the null reference on line 42 of CustomerService" });
assert(untaggedCode.includes("engineering"), "generic code work receives engineering guidance");

const [globalPolicy, communicationPolicy, engineeringPolicy, grillMePolicy, dashboardDefaultPolicy] = await Promise.all([
  readFile(new URL("./preferences/global.md", import.meta.url), "utf8"),
  readFile(new URL("./preferences/communication.md", import.meta.url), "utf8"),
  readFile(new URL("./preferences/engineering.md", import.meta.url), "utf8"),
  readFile(new URL("./preferences/grill-me.md", import.meta.url), "utf8"),
  readFile(new URL("./preferences/dashboard-default.md", import.meta.url), "utf8"),
]);
assert(communicationPolicy.includes("TL;DR:"), "baseline guidance includes the TL;DR rule");
assert(
  communicationPolicy.includes("concise without limiting investigation"),
  "concise presentation does not cap investigation"
);
assert(globalPolicy.includes("Investigate and verify in proportion to risk"), "baseline scales investigation to risk");
assert(globalPolicy.toLowerCase().includes("analysis, diagnosis, planning, and review are read-only"), "baseline respects the requested authority boundary");
assert(globalPolicy.includes("further work is unlikely to change the result"), "baseline defines a stopping condition");
assert(engineeringPolicy.includes("authoritative documentation"), "engineering guidance updates changed contracts");
assert(engineeringPolicy.includes("affected known consumers in proportion to risk"), "engineering guidance requires proportional downstream verification");
assert(engineeringPolicy.includes("Name untested consumers"), "engineering guidance reports missing verification");
assert(grillMePolicy.includes("Map them as a decision tree"), "grill-me explores a decision tree");
assert(grillMePolicy.includes("include your recommended answer"), "grill-me gives the agent's recommendation");
assert(grillMePolicy.includes("Wait for the user's answers after each round"), "grill-me pauses between rounds");
assert(grillMePolicy.includes("the user confirms the shared understanding"), "grill-me requires an explicit completion check");
assert(dashboardDefaultPolicy.includes("One dominant visualization"), "dashboard default establishes one visual priority");
assert(dashboardDefaultPolicy.includes("Do not lead with equally weighted KPI cards"), "dashboard default rejects generic KPI grids");

console.log(`MCP routing tests passed (${routingCases.length + 21} checks).`);

function assertEqual(name, actual, expected) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${name}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(`MCP routing test failed: ${message}`);
}
