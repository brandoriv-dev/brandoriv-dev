export const categoryDefinitions = [
  { id: "global", title: "Global", keywords: ["general", "global", "default", "simple", "tradeoff"] },
  { id: "grill-me", title: "Grill Me", keywords: ["/grill-me", "/grill me", "grill me", "grill my", "stress-test my idea"] },
  { id: "communication", title: "Communication", keywords: ["communicate", "explain", "concise", "summary", "recommendation"] },
  { id: "code-style", title: "Code Style Check", keywords: ["code style", "style rules", "coding style", "formatting"] },
  { id: "engineering", title: "Engineering", keywords: ["code", "implement", "architecture", "refactor", "test", "change"] },
  { id: "frontend-design", title: "Frontend Design", keywords: ["frontend", "front end", "web app", "website", "landing page", "dashboard", "user interface", "ui design", "ux design", "design system", "responsive design", "mobile layout", "dark theme", "data visualization", "chart", "component library"] },
  { id: "debugging", title: "Debugging", keywords: ["debug", "debugging", "debugged", "error", "errors", "exception", "exceptions", "failure", "failures", "root cause", "bug", "bugs", "investigate", "investigating", "timeout", "timeouts", "troubleshoot", "troubleshooting"] },
  { id: "dotnet", title: ".NET", keywords: [".net", "dotnet", "c#", "asp.net", "dependency injection", "nullable", "entity framework", "ef core"] },
  { id: "csharp-style", title: "C# Style", keywords: ["c#", "csharp", "c-sharp", ".net", "dotnet", "readable c#", "explicit c#", "c# style", "csharp style", "primary constructor", "primary constructors", "ternary", "ternaries", "guard clause", "guard clauses"] },
  { id: "typescript-javascript", title: "TypeScript and JavaScript", keywords: ["typescript", "javascript", "tsx", "jsx", "react", "astro"] },
  { id: "python", title: "Python", keywords: ["python", "pyproject", "pytest", "pip", "django", "flask", "fastapi"] },
  { id: "powershell", title: "PowerShell", keywords: ["powershell", "pwsh", "ps1", "psm1", "cmdlet"] },
  { id: "infrastructure-as-code", title: "Infrastructure as Code", keywords: ["bicep", "terraform", "infrastructure as code", "iac", "arm template", "cloudformation"] },
  { id: "sql", title: "SQL", keywords: ["sql", "t-sql", "database", "schema", "database migration", "schema migration", "sql migration", "ef migration", "ef core migration", "stored procedure", "etl", "entity framework", "ef core"] },
  { id: "research", title: "Research", keywords: ["research", "researching", "docs", "documentation", "official", "api reference", "specification", "release note", "release notes", "security advisory", "support policy", "latest version", "current version", "look up", "browse", "verify online"] },
  { id: "code-review", title: "Code Review", keywords: ["review", "reviewing", "reviewed", "code review", "pull request"] },
  { id: "unslop", title: "Unslop", keywords: ["/unslop", "unslop", "de-slop", "deslop", "humanize", "less robotic", "ai writing", "ai-generated", "ai generated", "writing tells", "prose cleanup", "clean up drafted prose"] },
] as const;

export type CategoryId = (typeof categoryDefinitions)[number]["id"];

export interface GuidanceInput {
  task: string;
  language?: string;
  framework?: string;
  categories?: string[];
}

const MAX_RELEVANT_CATEGORIES = 6;
// Keep initialization cheap. Specialized writing and code-style policies are
// routed only when the task needs them.
export const baselineIds = ["global", "communication"] as const;
const baselineIdSet = new Set<CategoryId>(baselineIds);
const taskModeIds = new Set<CategoryId>(["debugging", "research", "code-review", "frontend-design"]);
const domainIds = new Set<CategoryId>([
  "dotnet",
  "csharp-style",
  "typescript-javascript",
  "python",
  "powershell",
  "infrastructure-as-code",
  "sql",
]);

export function selectRelevantCategoryIds(input: GuidanceInput): CategoryId[] {
  const requested = new Set(input.categories ?? []);
  if (requested.size > 0) {
    return includeBaseline(
      categoryDefinitions.map(({ id }) => id).filter((id) => requested.has(id))
    );
  }

  const text = [input.task, input.language, input.framework].filter(Boolean).join(" ");
  const matchedBaseline = categoryDefinitions
    .filter(({ id }) => baselineIdSet.has(id))
    .some(({ keywords }) => keywords.some((keyword) => matchesKeyword(text, keyword)));
  const selected = categoryDefinitions
    .filter(({ id }) => !baselineIdSet.has(id))
    .map((category, index) => ({
      id: category.id,
      index,
      score: category.keywords.filter((keyword) => matchesKeyword(text, keyword)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        routingPriority(right.id) - routingPriority(left.id) ||
        right.score - left.score ||
        left.index - right.index
    )
    .slice(0, MAX_RELEVANT_CATEGORIES)
    .map(({ id }) => id);

  const firstCodeIndex = selected.findIndex((id) => domainIds.has(id) || id === "engineering");
  if (firstCodeIndex >= 0 && !selected.includes("code-style")) selected.splice(firstCodeIndex, 0, "code-style");

  if (selected.length === 0 && !matchedBaseline) selected.push("code-style", "engineering");
  return includeBaseline(selected);
}

function routingPriority(id: CategoryId) {
  if (taskModeIds.has(id)) return 2;
  if (domainIds.has(id)) return 1;
  return 0;
}

function includeBaseline(selected: readonly CategoryId[]): CategoryId[] {
  const next = [...selected];
  const ids = new Set(next);

  for (const id of [...baselineIds].reverse()) {
    if (!ids.has(id)) next.unshift(id);
  }

  return next;
}

function matchesKeyword(text: string, keyword: string) {
  const phrase = keyword
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");

  return new RegExp(`(?<![a-z0-9])${phrase}(?![a-z0-9])`, "i").test(text);
}
