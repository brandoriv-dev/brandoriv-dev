import codeReview from "./preferences/code-review.md";
import communication from "./preferences/communication.md";
import debugging from "./preferences/debugging.md";
import dotnet from "./preferences/dotnet.md";
import engineering from "./preferences/engineering.md";
import global from "./preferences/global.md";
import research from "./preferences/research.md";
import sql from "./preferences/sql.md";

export const categories = [
  { id: "global", title: "Global", content: global, keywords: ["general", "global", "default", "simple", "tradeoff"] },
  { id: "communication", title: "Communication", content: communication, keywords: ["communicate", "explain", "concise", "summary", "recommendation"] },
  { id: "engineering", title: "Engineering", content: engineering, keywords: ["code", "implement", "architecture", "refactor", "test", "change"] },
  { id: "debugging", title: "Debugging", content: debugging, keywords: ["debug", "error", "exception", "failure", "root cause", "bug"] },
  { id: "dotnet", title: ".NET", content: dotnet, keywords: [".net", "dotnet", "c#", "asp.net", "dependency injection", "nullable"] },
  { id: "sql", title: "SQL", content: sql, keywords: ["sql", "database", "schema", "migration", "stored procedure", "view", "etl"] },
  { id: "research", title: "Research", content: research, keywords: ["research", "docs", "documentation", "source", "current", "latest"] },
  { id: "code-review", title: "Code Review", content: codeReview, keywords: ["review", "pr", "pull request", "regression", "risk"] },
] as const;

export type PreferenceCategory = (typeof categories)[number];

export function listCategorySummaries() {
  return categories.map(({ id, title }) => ({ id, title }));
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}

export function selectRelevantCategories(input: {
  task: string;
  language?: string;
  framework?: string;
  categories?: string[];
}) {
  const requested = new Set(input.categories ?? []);
  if (requested.size > 0) {
    return includeBaseline(categories.filter((category) => requested.has(category.id)));
  }

  const text = [input.task, input.language, input.framework].filter(Boolean).join(" ").toLowerCase();
  const selected = categories.filter((category) =>
    category.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  );

  return includeBaseline(
    selected.length > 0 ? selected : categories.filter((category) => category.id === "engineering")
  );
}

export function allCategories() {
  return [...categories];
}

export function formatGuidance(selected: readonly PreferenceCategory[]) {
  return selected.map((category) => category.content.trim()).join("\n\n---\n\n");
}

function includeBaseline(selected: readonly PreferenceCategory[]) {
  const next = [...selected];
  const ids = new Set(next.map((category) => category.id));
  const baseline = categories.filter((category) => category.id === "global" || category.id === "communication");

  for (const category of baseline.reverse()) {
    if (!ids.has(category.id)) next.unshift(category);
  }

  return next;
}
