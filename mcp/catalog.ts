import { categories } from "./preferences.ts";
import grillMe from "./preferences/grill-me.md";
import { baselineIds, categoryDefinitions, type CategoryId } from "./routing.ts";

export type CatalogKind = "group" | "router" | "policy" | "command";

export interface CatalogNode {
  id: string;
  title: string;
  description?: string;
  kind: CatalogKind;
  parentId: string | null;
  activation: "always" | "routed" | "explicit";
  version: number;
  content: string;
  keywords: readonly string[];
  reviewedAt: string;
  relatedSkills: readonly string[];
  relatedTools: readonly string[];
}

const catalogReviewedAt = "2026-09-23T23:54:00.000Z";

const parents: Partial<Record<CategoryId, string>> = {
  global: "core",
  communication: "core",
  engineering: "workflows",
  "frontend-design": "design",
  "dashboard-default": "design",
  debugging: "workflows",
  research: "workflows",
  "code-review": "workflows",
  dotnet: "code-style-dotnet",
  "csharp-style": "code-style-dotnet",
  "typescript-javascript": "code-style-web",
  python: "code-style-group",
  powershell: "code-style-group",
  "infrastructure-as-code": "code-style-group",
  sql: "code-style-data",
  unslop: "writing",
};

const capabilities: Partial<Record<CategoryId, Pick<CatalogNode, "relatedSkills" | "relatedTools">>> = {
  "frontend-design": {
    relatedSkills: ["frontend-design-workflow", "impeccable", "emil-design-eng", "design-taste-frontend"],
    relatedTools: ["figma-mcp", "browser-automation"],
  },
  "dashboard-default": {
    relatedSkills: ["frontend-design-workflow", "impeccable"],
    relatedTools: ["browser-automation"],
  },
  debugging: {
    relatedSkills: [],
    relatedTools: ["runtime-diagnostics"],
  },
  research: {
    relatedSkills: [],
    relatedTools: ["web-search", "web-fetch"],
  },
  "code-review": {
    relatedSkills: ["review-bugbot", "review-security"],
    relatedTools: ["source-control"],
  },
  unslop: {
    relatedSkills: ["unslop"],
    relatedTools: [],
  },
};

const groups: CatalogNode[] = [
  group("core", "Always on", null, "Guidance included for every task."),
  group("workflows", "Workflows", null, "Task-specific methods for building, debugging, research, and review."),
  group("code-style-group", "Code style", null, "Language and platform conventions selected for code work."),
  group("code-style-dotnet", ".NET", "code-style-group"),
  group("code-style-web", "Web", "code-style-group"),
  group("code-style-data", "Data", "code-style-group"),
  group("writing", "Writing", null, "Voice and editing rules selected for prose work."),
  group("design", "Design", null, "Product, interface, visualization, and anti-template guidance."),
];

const policyNodes: CatalogNode[] = categories.map((category) => {
  const definition = categoryDefinitions.find(({ id }) => id === category.id)!;
  const related = capabilities[category.id];
  return {
    id: category.id,
    title: category.title,
    kind: "policy",
    parentId: parents[category.id] ?? null,
    activation: baselineIds.includes(category.id as (typeof baselineIds)[number])
      ? "always"
      : category.id === "dashboard-default"
        ? "explicit"
        : "routed",
    version: 1,
    content: category.content.trim(),
    keywords: definition.keywords,
    reviewedAt: catalogReviewedAt,
    relatedSkills: related?.relatedSkills ?? [],
    relatedTools: related?.relatedTools ?? [],
  };
});

const commands: CatalogNode[] = [
  group("commands", "Commands", null, "Explicit workflows invoked by name."),
  {
    id: "command:grill-me",
    title: "Grill me",
    kind: "command",
    parentId: "commands",
    activation: "explicit",
    version: 1,
    keywords: [],
    content: grillMe.trim(),
    reviewedAt: catalogReviewedAt,
    relatedSkills: ["grill-me"],
    relatedTools: [],
  },
];

export const defaultCatalog = [...groups, ...policyNodes, ...commands];

function group(id: string, title: string, parentId: string | null, description?: string): CatalogNode {
  return {
    id,
    title,
    description,
    kind: "group",
    parentId,
    activation: "explicit",
    version: 1,
    content: "",
    keywords: [],
    reviewedAt: catalogReviewedAt,
    relatedSkills: [],
    relatedTools: [],
  };
}
