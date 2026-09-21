import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  allCategories,
  formatGuidance,
  getCategory,
  listCategorySummaries,
  selectRelevantCategories,
} from "./preferences";
import { baselineIds } from "./routing";
import { bootstrapInstruction, serviceDisplayName, serviceEndpoint, serviceIcons, serviceName, serviceVersion } from "./service";
import { createPolicyStore, type PolicyStore } from "./policy-store";

const categoryIdSchema = z.enum([
  "global",
  "communication",
  "code-style",
  "engineering",
  "debugging",
  "dotnet",
  "csharp-style",
  "typescript-javascript",
  "python",
  "powershell",
  "infrastructure-as-code",
  "sql",
  "research",
  "unslop",
  "code-review",
  "grill-me",
]);

// The first 512 characters stay self-contained, since Codex shows only that much.
// Instructions arrive on initialize, so every client on every device receives the
// baseline with no tool call and no per-machine setup. Clients that ignore
// instructions still get it from get_guidance, which always includes the baseline.
const baselineGuidance = formatGuidance(baselineIds.map((id) => getCategory(id)).filter(isDefined));
const serverInstructions = `${bootstrapInstruction}\n\n---\n\n${baselineGuidance}`;

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function createPersonalContextServer(store: PolicyStore = createPolicyStore()) {
  const server = new McpServer(
    {
      name: serviceName,
      title: serviceDisplayName,
      version: serviceVersion,
      description: "Brandon Rivera's read-only working preferences for AI agents.",
      websiteUrl: serviceEndpoint,
      icons: [...serviceIcons],
    },
    { instructions: serverInstructions }
  );

  server.registerTool(
    "list_preference_categories",
    {
      title: "List Preference Categories",
      description: "List the read-only personal preference categories available from this MCP server.",
      inputSchema: z.object({}),
      icons: [...serviceIcons],
      annotations: readOnlyAnnotations,
    },
    async () => {
      const categories = (await store.list()).filter(({ kind }) => kind !== "group" && kind !== "command").map(({ id, title }) => ({ id, title }));
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
      icons: [...serviceIcons],
      annotations: readOnlyAnnotations,
    },
    async ({ category }) => {
      const active = await store.list();
      const selected = (category === "all" ? active : active.filter(({ id }) => id === category)).filter(({ kind }) => kind === "policy" || kind === "router");
      const text = formatGuidance(selected);
      return {
        content: [{ type: "text", text }],
        // Guidance is duplicated into structuredContent on purpose. Clients that
        // surface structuredContent ignore the content block entirely, and a
        // categories-only payload silently delivers an empty policy.
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
      description: "Default retrieval path. Return Brandon's compact, relevant working preferences for a specific coding-agent task.",
      inputSchema: z.object({
        task: z.string().min(1).describe("The task the AI coding agent is about to perform."),
        language: z.string().optional().describe("Primary language, if known."),
        framework: z.string().optional().describe("Primary framework, if known."),
        categories: z.array(categoryIdSchema).optional().describe("Optional explicit preference categories to include."),
      }),
      icons: [...serviceIcons],
      annotations: readOnlyAnnotations,
    },
    async (input) => {
      const ids = selectRelevantCategories(input).map(({ id }) => id);
      const selected = (await store.list()).filter((item) => ids.includes(item.id as (typeof ids)[number]));
      const text = formatGuidance(selected);
      return {
        content: [{ type: "text", text }],
        // See get_preferences: structuredContent must carry the guidance itself.
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
        const category = (await store.list()).find((item) => item.id === id);
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

  server.registerPrompt(
    "grill-me",
    { title: "Grill me", description: "Challenge a proposal one precise question at a time before implementation." },
    async () => {
      const command = (await store.list()).find(({ id }) => id === "grill-me");
      return { messages: [{ role: "user", content: { type: "text", text: command?.content ?? "Grill this proposal." } }] };
    }
  );

  return server;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
