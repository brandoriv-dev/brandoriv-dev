// The representative task corpus shared by mcp:policy-eval (deterministic pattern
// coverage, always run) and mcp:answer-study (real model-answer quality, run
// separately because it costs live usage). Keeping one array means both suites
// measure the same tasks; a change here changes both at once.
export const cases = [
  { name: "small implementation", input: { task: "Implement the smallest safe code change and test it" } },
  { name: "architecture decision", input: { task: "Explain the architecture tradeoffs before changing this service" } },
  {
    name: "JavaScript exception",
    input: { task: "Debug this JavaScript exception and fix the root cause" },
    allowPayloadGrowth: "adds JavaScript-specific safety and verification guidance",
  },
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
  {
    name: "React GraphQL",
    input: { task: "Implement a React view for this GraphQL query" },
    allowPayloadGrowth: "adds TypeScript/JavaScript framework guidance without the SQL false positive",
  },
  { name: "current source file", input: { task: "Change the current source file" } },
  { name: "concise explanation", input: { task: "Explain this unfamiliar concept concisely" } },
  { name: "deployment failure", input: { task: "Troubleshoot the deployment failures and verify the fix" } },
  { name: "database dependencies", input: { task: "Change a database stored procedure without breaking dependent ETL" } },
  { name: "API specification", input: { task: "Look up the current API specification and recommend an approach" } },
  {
    name: "PR campaign",
    input: { task: "Implement a PR campaign dashboard" },
    allowPayloadGrowth: "adds routed frontend information-design, visualization, and anti-template guidance",
  },
  { name: "AWS migration", input: { task: "Plan an AWS migration" } },
  { name: "regression model", input: { task: "Evaluate this regression model" } },
  { name: "explicit research", input: { task: "Evaluate this choice", categories: ["research"] } },
  { name: "explicit audit mix", input: { task: "Audit these policies", categories: ["debugging", "dotnet", "sql", "research", "code-review"] } },
  {
    name: "Python implementation",
    input: { task: "Implement a FastAPI endpoint", language: "Python" },
    allowPayloadGrowth: "adds Python-specific safety and verification guidance",
  },
  {
    name: "PowerShell debugging",
    input: { task: "Debug this deployment script", language: "PowerShell" },
    allowPayloadGrowth: "adds PowerShell-specific safety guidance",
  },
  {
    name: "Bicep review",
    input: { task: "Review this Bicep deployment" },
    allowPayloadGrowth: "adds infrastructure-specific review and validation guidance",
  },
];
export const legacyCaseCount = 23;

export function formatGuidance(ids, policies) {
  return ids.map((id) => policies[id].trim()).join("\n\n---\n\n");
}

export function wordCount(value) {
  return value.match(/[A-Za-z0-9_.#-]+/g)?.length ?? 0;
}

export function percentChange(before, after) {
  if (before === 0) return 0;
  return Number((((after - before) / before) * 100).toFixed(1));
}
