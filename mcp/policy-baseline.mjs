// Frozen from commit b06b99e, the v1 policy used for before/after evaluation.
export const baselineCommit = "b06b99e";

export const baselineCategoryDefinitions = [
  { id: "global", title: "Global", keywords: ["general", "global", "default", "simple", "tradeoff"] },
  { id: "communication", title: "Communication", keywords: ["communicate", "explain", "concise", "summary", "recommendation"] },
  { id: "engineering", title: "Engineering", keywords: ["code", "implement", "architecture", "refactor", "test", "change"] },
  { id: "debugging", title: "Debugging", keywords: ["debug", "error", "exception", "failure", "root cause", "bug"] },
  { id: "dotnet", title: ".NET", keywords: [".net", "dotnet", "c#", "asp.net", "dependency injection", "nullable"] },
  { id: "sql", title: "SQL", keywords: ["sql", "database", "schema", "migration", "stored procedure", "view", "etl"] },
  { id: "research", title: "Research", keywords: ["research", "docs", "documentation", "source", "current", "latest"] },
  { id: "code-review", title: "Code Review", keywords: ["review", "pr", "pull request", "regression", "risk"] },
];

export const baselinePolicies = {
  global: `# Global Preferences

- Prefer simple solutions.
- Investigate existing code before introducing new patterns.
- Explain important tradeoffs.
- Challenge my assumptions when evidence suggests I am wrong.
- Prefer actually completing a task over only telling me how to complete it.`,
  communication: `# Communication Preferences

- Explain unfamiliar concepts simply.
- Do not over-explain obvious syntax.
- Be concise for straightforward tasks.
- Go deeper when debugging or architecture requires it.
- Clearly distinguish facts, assumptions, and recommendations.`,
  engineering: `# Engineering Preferences

- Follow existing architecture unless there is a good reason not to.
- Prefer the smallest safe change.
- Avoid unrelated refactoring.
- Look for existing implementations before creating new ones.
- Consider tests and downstream impact.`,
  debugging: `# Debugging Preferences

Default debugging workflow:

1. Identify the actual failure.
2. Determine where the incorrect state or value originated.
3. Trace toward the root cause.
4. Explain the root cause.
5. Make the smallest safe fix.
6. Determine what tests prove the fix.

Do not simply suppress errors or patch symptoms.`,
  dotnet: `# .NET Preferences

- Prefer modern supported .NET APIs.
- Follow existing dependency-injection conventions.
- Prefer strongly typed solutions.
- Respect nullable-reference-type conventions.
- Avoid unnecessary interfaces.
- Check current Microsoft documentation for version-sensitive behavior.`,
  sql: `# SQL Preferences

- Inspect the actual schema before proposing schema changes.
- Consider whether code, migrations, and deployed database schema are out of sync.
- Investigate non-destructively first.
- Consider dependent views, procedures, ETL, and applications before modifying shared objects.`,
  research: `# Research Preferences

- Use current primary sources for version-sensitive facts.
- Clearly separate sourced facts from assumptions and recommendations.
- Prefer official documentation, specifications, release notes, and source repositories for technical research.
- Summarize the decision-relevant parts instead of dumping source text.`,
  "code-review": `# Code Review Preferences

- Prioritize bugs, regressions, security risks, and missing tests.
- Lead with findings ordered by severity.
- Cite concrete files, lines, behaviors, or reproduction paths.
- Keep summaries secondary to actionable review findings.
- Say clearly when no issues are found, and call out residual test gaps.`,
};
