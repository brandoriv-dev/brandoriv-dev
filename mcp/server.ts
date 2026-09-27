import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  allCategories,
  formatGuidance,
  getCategory,
  listPolicyResources,
  selectRelevantCategories,
} from "./preferences";
import { baselineIds, categoryDefinitions, type CategoryId } from "./routing";
import { bootstrapInstruction, serviceDisplayName, serviceEndpoint, serviceIcons, serviceName, serviceVersion } from "./service";
import { createPolicyStore, type PolicyStore } from "./policy-store";
import type { EventLogger } from "./event-log";
import { shadowJevRouting, type JevRouterConfig } from "./jev-router";

const categoryIds = categoryDefinitions.map(({ id }) => id) as [CategoryId, ...CategoryId[]];
const categoryIdSchema = z.enum(categoryIds);
const commandIdSchema = z.enum(["grill-me"]);

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

export interface PersonalContextServerOptions {
  eventLogger?: EventLogger;
  jev?: JevRouterConfig;
  waitUntil?: (promise: Promise<unknown>) => void;
}

export function createPersonalContextServer(
  store: PolicyStore = createPolicyStore(),
  options: PersonalContextServerOptions = {}
) {
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
        mode: z
          .enum(["answer", "plan", "implement", "diagnose", "fix", "review", "research", "write"])
          .optional()
          .describe("Task mode, when known."),
        artifacts: z.array(z.string()).optional().describe("Relevant artifact types or file extensions, when known."),
        categories: z
          .array(categoryIdSchema)
          .optional()
          .describe("Optional preference categories to add to inferred guidance."),
        command: commandIdSchema.optional().describe("Optional explicit command workflow."),
      }),
      icons: [...serviceIcons],
      annotations: readOnlyAnnotations,
    },
    async (input) => {
      const ids = selectRelevantCategories(input).map(({ id }) => id);
      if (options.jev?.mode === "shadow") {
        const shadow = shadowJevRouting(input, options.jev, {
          deterministicIds: ids,
          logger: options.eventLogger,
        });
        if (options.waitUntil) options.waitUntil(shadow);
        else void shadow;
      }
      const active = await store.list();
      const selected = active.filter(
        (item) => (item.kind === "policy" || item.kind === "router") && ids.includes(item.id as (typeof ids)[number])
      );
      const commandId = input.command ?? (isGrillMeTask(input.task) ? "grill-me" : undefined);
      const command = commandId
        ? active.find((item) => item.kind === "command" && item.id === `command:${commandId}`)
        : undefined;
      const delivered = command ? [...selected, command] : selected;
      const text = formatGuidance(delivered);
      return {
        content: [{ type: "text", text }],
        // See get_preferences: structuredContent must carry the guidance itself.
        structuredContent: {
          categories: selected.map((item) => item.id),
          commands: command ? [commandId] : [],
          guidance: text,
        },
      };
    }
  );

  for (const resource of listPolicyResources()) {
    const { id, title } = resource;
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: `${title} Preferences`,
        description: `Read-only ${title.toLowerCase()} preferences for AI coding agents.`,
        mimeType: resource.mimeType,
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
      const command = (await store.list()).find(({ id }) => id === "command:grill-me");
      return { messages: [{ role: "user", content: { type: "text", text: command?.content ?? "Grill this proposal." } }] };
    }
  );

  return server;
}

function isGrillMeTask(task: string) {
  return /(?:^|\s)\/?grill(?:-|\s)me(?:\s|$)/i.test(task);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
