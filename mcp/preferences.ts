import codeReview from "./preferences/code-review.md";
import communication from "./preferences/communication.md";
import csharpStyle from "./preferences/csharp-style.md";
import dashboardDefault from "./preferences/dashboard-default.md";
import debugging from "./preferences/debugging.md";
import dotnet from "./preferences/dotnet.md";
import engineering from "./preferences/engineering.md";
import frontendDesign from "./preferences/frontend-design.md";
import global from "./preferences/global.md";
import infrastructureAsCode from "./preferences/infrastructure-as-code.md";
import powershell from "./preferences/powershell.md";
import python from "./preferences/python.md";
import research from "./preferences/research.md";
import sql from "./preferences/sql.md";
import typescriptJavascript from "./preferences/typescript-javascript.md";
import unslop from "./preferences/unslop.md";
import { categoryDefinitions, selectRelevantCategoryIds, type CategoryId, type GuidanceInput } from "./routing";

const contentByCategory = {
  global,
  communication,
  engineering,
  "frontend-design": frontendDesign,
  "dashboard-default": dashboardDefault,
  debugging,
  dotnet,
  "csharp-style": csharpStyle,
  "typescript-javascript": typescriptJavascript,
  python,
  powershell,
  "infrastructure-as-code": infrastructureAsCode,
  sql,
  research,
  unslop,
  "code-review": codeReview,
} satisfies Record<CategoryId, string>;

export const categories = categoryDefinitions.map(({ id, title }) => ({
  id,
  title,
  content: contentByCategory[id],
}));

export type PreferenceCategory = (typeof categories)[number];

export function listCategorySummaries() {
  return categories.map(({ id, title }) => ({ id, title }));
}

export function listPolicyResources() {
  return categories.map(({ id, title }) => ({
    id,
    title,
    name: `personal-${id}`,
    uri: `personal://${id}`,
    mimeType: "text/markdown",
    sourcePath: `mcp/preferences/${id}.md`,
  }));
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}

export function selectRelevantCategories(input: GuidanceInput) {
  return selectRelevantCategoryIds(input)
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is PreferenceCategory => category !== undefined);
}

export function allCategories() {
  return [...categories];
}

export function formatGuidance(selected: readonly { content: string }[]) {
  return selected.map((category) => category.content.trim()).join("\n\n---\n\n");
}
