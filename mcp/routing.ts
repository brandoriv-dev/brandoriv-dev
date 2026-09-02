export const categoryDefinitions = [
  { id: "global", title: "Global", keywords: ["general", "global", "default", "simple", "tradeoff"] },
  { id: "communication", title: "Communication", keywords: ["communicate", "explain", "concise", "summary", "recommendation"] },
  { id: "engineering", title: "Engineering", keywords: ["code", "implement", "architecture", "refactor", "test", "change"] },
  { id: "debugging", title: "Debugging", keywords: ["debug", "debugging", "debugged", "error", "errors", "exception", "exceptions", "failure", "failures", "root cause", "bug", "bugs", "investigate", "investigating", "timeout", "timeouts", "troubleshoot", "troubleshooting"] },
  { id: "dotnet", title: ".NET", keywords: [".net", "dotnet", "c#", "asp.net", "dependency injection", "nullable", "entity framework", "ef core"] },
  { id: "sql", title: "SQL", keywords: ["sql", "t-sql", "database", "schema", "migration", "stored procedure", "etl", "entity framework", "ef core"] },
  { id: "research", title: "Research", keywords: ["research", "researching", "docs", "documentation", "official", "api reference", "specification", "release note", "release notes", "security advisory", "support policy", "latest version", "current version", "look up", "browse", "verify online"] },
  { id: "code-review", title: "Code Review", keywords: ["review", "reviewing", "reviewed", "code review", "pull request", "pr", "regression", "regressions"] },
] as const;

export type CategoryId = (typeof categoryDefinitions)[number]["id"];

export interface GuidanceInput {
  task: string;
  language?: string;
  framework?: string;
  categories?: string[];
}

const MAX_RELEVANT_CATEGORIES = 5;
const baselineIds = ["global", "communication", "engineering"] as const;
const baselineIdSet = new Set<CategoryId>(baselineIds);
const taskModeIds = new Set<CategoryId>(["debugging", "research", "code-review"]);
const domainIds = new Set<CategoryId>(["dotnet", "sql"]);

export function selectRelevantCategoryIds(input: GuidanceInput): CategoryId[] {
  const requested = new Set(input.categories ?? []);
  if (requested.size > 0) {
    return includeBaseline(
      categoryDefinitions.map(({ id }) => id).filter((id) => requested.has(id))
    );
  }

  const text = [input.task, input.language, input.framework].filter(Boolean).join(" ");
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
