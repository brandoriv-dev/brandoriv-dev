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

export function createPersonalContextServer() {
  const server = new McpServer({
    name: "brandoriv-personal-context",
    version: "1.0.0",
  });

  server.registerTool(
    "list_preference_categories",
    {
      title: "List Preference Categories",
      description: "List the read-only personal preference categories available from this MCP server.",
      inputSchema: z.object({}),
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
      description: "Return one preference category, or all categories when no category is provided.",
      inputSchema: z.object({
        category: categoryIdSchema.optional(),
      }),
    },
    async ({ category }) => {
      const selected = category ? [getCategory(category)].filter(isDefined) : allCategories();
      const text = formatGuidance(selected);
      return {
        content: [{ type: "text", text }],
        structuredContent: {
          categories: selected.map((item) => item.id),
          guidance: text,
        },
      };
    }
  );

  server.registerTool(
    "get_guidance",
    {
      title: "Get Task Guidance",
      description: "Return Brandon's relevant working preferences for a specific coding-agent task.",
      inputSchema: z.object({
        task: z.string().min(1).describe("The task the AI coding agent is about to perform."),
        language: z.string().optional().describe("Primary language, if known."),
        framework: z.string().optional().describe("Primary framework, if known."),
        categories: z.array(categoryIdSchema).optional().describe("Optional explicit preference categories to include."),
      }),
    },
    async (input) => {
      const selected = selectRelevantCategories(input);
      const text = formatGuidance(selected);
      return {
        content: [{ type: "text", text }],
        structuredContent: {
          categories: selected.map((item) => item.id),
          guidance: text,
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
