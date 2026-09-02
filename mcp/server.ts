import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  allCategories,
  formatGuidance,
  getCategory,
  listCategorySummaries,
  selectRelevantCategories,
} from "./preferences";

const categoryIdSchema = z.enum([
  "global",
  "communication",
  "engineering",
  "debugging",
  "dotnet",
  "sql",
  "research",
  "code-review",
]);

const serverInstructions =
  "Brandon's canonical coding-agent preferences live here. Before substantive technical work, call get_guidance with the complete task and known language/framework. Follow the returned preferences unless Brandon's current request overrides them. If an obviously relevant category is missing, call get_preferences for it. Use category=\"all\" only for explicit policy audits; do not load the full policy for routine work.";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function createPersonalContextServer() {
  const server = new McpServer(
    {
      name: "brandoriv-personal-context",
      version: "1.2.0",
    },
    { instructions: serverInstructions }
  );

  server.registerTool(
    "list_preference_categories",
    {
      title: "List Preference Categories",
      description: "List the read-only personal preference categories available from this MCP server.",
      inputSchema: z.object({}),
      annotations: readOnlyAnnotations,
    },
    async () => {
      const categories = listCategorySummaries();
      return {
        content: [{ type: "text", text: JSON.stringify(categories, null, 2) }],
        structuredContent: { categories },
      };
    }
  );

  server.registerTool(
    "get_preferences",
    {
      title: "Get Preferences",
      description: "Return one named preference category. Use category=\"all\" only for an explicit full-policy audit; use get_guidance for normal task work.",
      inputSchema: z.object({
        category: z
          .union([categoryIdSchema, z.literal("all")])
          .describe("One preference category, or 'all' for an explicit full-policy audit."),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ category }) => {
      const selected = category === "all" ? allCategories() : [getCategory(category)].filter(isDefined);
      const text = formatGuidance(selected);
      return {
        content: [{ type: "text", text }],
        structuredContent: {
          categories: selected.map((item) => item.id),
        },
      };
    }
  );

  server.registerTool(
    "get_guidance",
    {
      title: "Get Task Guidance",
      description: "Default retrieval path. Return Brandon's compact, relevant working preferences for a specific coding-agent task.",
      inputSchema: z.object({
        task: z.string().min(1).describe("The task the AI coding agent is about to perform."),
        language: z.string().optional().describe("Primary language, if known."),
        framework: z.string().optional().describe("Primary framework, if known."),
        categories: z.array(categoryIdSchema).optional().describe("Optional explicit preference categories to include."),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => {
      const selected = selectRelevantCategories(input);
      const text = formatGuidance(selected);
      return {
        content: [{ type: "text", text }],
        structuredContent: {
          categories: selected.map((item) => item.id),
        },
      };
    }
  );

  for (const { id, title } of listCategorySummaries()) {
    server.registerResource(
      `personal-${id}`,
      `personal://${id}`,
      {
        title: `${title} Preferences`,
        description: `Read-only ${title.toLowerCase()} preferences for AI coding agents.`,
        mimeType: "text/markdown",
      },
      async (uri) => {
        const category = getCategory(id);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: category?.content ?? "",
            },
          ],
        };
      }
    );
  }

  return server;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
