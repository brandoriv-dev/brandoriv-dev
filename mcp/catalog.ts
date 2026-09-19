import { categories } from "./preferences.ts";
import { baselineIds, categoryDefinitions, type CategoryId } from "./routing.ts";

export type CatalogKind = "group" | "router" | "policy" | "command";

export interface CatalogNode {
  id: string;
  title: string;
  kind: CatalogKind;
  parentId: string | null;
  activation: "always" | "routed" | "explicit";
  version: number;
  content: string;
  keywords: readonly string[];
}

const parents: Partial<Record<CategoryId, string>> = {
  global: "core",
  communication: "core",
  engineering: "workflows",
  debugging: "workflows",
  research: "workflows",
  "code-review": "workflows",
  "code-style": "code-style-group",
  dotnet: "code-style-dotnet",
  "csharp-style": "code-style-dotnet",
  "typescript-javascript": "code-style-web",
  python: "code-style-group",
  powershell: "code-style-group",
  "infrastructure-as-code": "code-style-group",
  sql: "code-style-data",
  unslop: "writing",
};

const groups: CatalogNode[] = [
  group("core", "Always on", null),
  group("workflows", "Workflows", null),
  group("code-style-group", "Code style", null),
  group("code-style-dotnet", ".NET", "code-style-group"),
  group("code-style-web", "Web", "code-style-group"),
  group("code-style-data", "Data", "code-style-group"),
  group("writing", "Writing", null),
];

const policyNodes: CatalogNode[] = categories.map((category) => {
  const definition = categoryDefinitions.find(({ id }) => id === category.id)!;
  return {
    id: category.id,
    title: category.title,
    kind: category.id === "code-style" ? "router" : "policy",
    parentId: parents[category.id] ?? null,
    activation: baselineIds.includes(category.id as (typeof baselineIds)[number]) ? "always" : "routed",
    version: 1,
    content: category.content.trim(),
    keywords: definition.keywords,
  };
});

const commands: CatalogNode[] = [
  group("commands", "Commands", null),
  {
    id: "grill-me",
    title: "Grill me",
    kind: "command",
    parentId: "commands",
    activation: "explicit",
    version: 1,
    keywords: [],
    content:
      "Interrogate my proposal before implementation. Ask one precise question at a time. Challenge assumptions, scope, evidence, failure modes, maintenance cost, security, and rollback. Stop when the decision is clear, then summarize the strongest case for and against it and recommend a next step.",
  },
];

export const defaultCatalog = [...groups, ...policyNodes, ...commands];

function group(id: string, title: string, parentId: string | null): CatalogNode {
  return { id, title, kind: "group", parentId, activation: "explicit", version: 1, content: "", keywords: [] };
}
