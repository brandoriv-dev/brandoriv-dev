import { baselineIds, categoryDefinitions, type CategoryId, type GuidanceInput } from "./routing.ts";
import type { EventLogger } from "./event-log.ts";

export interface JevRouterConfig {
  mode?: "off" | "shadow";
  apiKey?: string;
  endpoint?: string;
  model?: string;
  threshold?: number;
  sendRawTask?: boolean;
  timeoutMs?: number;
}

export interface JevShadowOptions {
  deterministicIds: readonly CategoryId[];
  logger?: EventLogger;
  fetcher?: typeof fetch;
}

const DEFAULT_MODEL = "jev-latest";
const DEFAULT_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const DEFAULT_THRESHOLD = 0.65;
const DEFAULT_TIMEOUT_MS = 1500;

const baselineIdSet = new Set<CategoryId>(baselineIds);
const routedCategories = categoryDefinitions.filter(({ id }) => !baselineIdSet.has(id));

export async function shadowJevRouting(
  input: GuidanceInput,
  config: JevRouterConfig,
  { deterministicIds, logger, fetcher = fetch }: JevShadowOptions
): Promise<void> {
  if (config.mode !== "shadow") return;

  const startedAt = Date.now();
  const basePayload = {
    mode: config.mode,
    model: config.model ?? DEFAULT_MODEL,
    threshold: thresholdFrom(config),
    taskLength: input.task.length,
    hasLanguage: Boolean(input.language),
    hasFramework: Boolean(input.framework),
    artifactCount: input.artifacts?.length ?? 0,
    explicitCategoryCount: input.categories?.length ?? 0,
    deterministicIds: [...deterministicIds],
    sendsRawTask: config.sendRawTask === true,
  };

  if (!config.apiKey) {
    logger?.log({
      type: "jev.routing.shadow",
      payload: { ...basePayload, status: "skipped", reason: "missing-api-key" },
    });
    return;
  }

  const request = buildJevRequest(input, config);
  const jev = await callJev(request, config, fetcher);
  const elapsedMs = Date.now() - startedAt;

  if ("error" in jev) {
    logger?.log({
      type: "jev.routing.shadow",
      payload: { ...basePayload, status: "error", elapsedMs, reason: jev.error },
    });
    return;
  }

  const candidateIds = includeRoutingInvariants(input, selectJevCategories(jev.answers, thresholdFrom(config)));
  logger?.log({
    type: "jev.routing.shadow",
    payload: {
      ...basePayload,
      status: "ok",
      elapsedMs,
      candidateIds,
      deterministicOnly: deterministicIds.filter((id) => !candidateIds.includes(id)),
      jevOnly: candidateIds.filter((id) => !deterministicIds.includes(id)),
      usage: jev.usage,
    },
  });
}

export function buildJevRequest(input: GuidanceInput, config: JevRouterConfig = {}) {
  const state = config.sendRawTask
    ? {
        task: input.task,
        language: input.language ?? null,
        framework: input.framework ?? null,
        mode: input.mode ?? null,
        artifacts: input.artifacts ?? [],
        explicitCategories: input.categories ?? [],
      }
    : {
        taskLength: input.task.length,
        language: Boolean(input.language),
        framework: Boolean(input.framework),
        mode: input.mode ?? null,
        artifactCount: input.artifacts?.length ?? 0,
        explicitCategories: input.categories ?? [],
      };

  return {
    model: config.model ?? DEFAULT_MODEL,
    state: JSON.stringify(state),
    questions: Object.fromEntries(
      routedCategories.map(({ id, title, keywords }) => [
        id,
        {
          type: "noul",
          instructions: `Should Brandon's MCP get_guidance response include the "${title}" policy category for this task?`,
          criteria: {
            true: `Include only when the task genuinely needs ${title} guidance. Keywords and hints: ${keywords.join(", ")}.`,
            false: "Do not include for substring coincidences, generic prose, unrelated meanings, or weak hints.",
          },
        },
      ])
    ),
  };
}

export function selectJevCategories(answers: Record<string, unknown>, threshold = DEFAULT_THRESHOLD): CategoryId[] {
  return routedCategories
    .filter(({ id }) => yesProbability(answers[id]) >= threshold)
    .map(({ id }) => id);
}

export function includeRoutingInvariants(input: GuidanceInput, categories: readonly CategoryId[]): CategoryId[] {
  const selected = [...categories];
  for (const id of input.categories ?? []) {
    if (isCategoryId(id) && !selected.includes(id)) selected.push(id);
  }
  if (selected.includes("dashboard-default") && !selected.includes("frontend-design")) {
    selected.splice(selected.indexOf("dashboard-default"), 0, "frontend-design");
  }
  for (const id of [...baselineIds].reverse()) {
    if (!selected.includes(id)) selected.unshift(id);
  }
  return selected;
}

function yesProbability(answer: unknown) {
  if (!answer || typeof answer !== "object") return 0;
  const value = answer as Record<string, unknown>;
  if (typeof value.noul === "number") return value.noul;
  if (typeof value.probability === "number") return value.probability;
  if (typeof value.yes_probability === "number") return value.yes_probability;
  if (typeof value.confidence === "number" && (value.answer === true || value.value === true || value.noul === true)) {
    return value.confidence;
  }
  const probabilities = value.probabilities;
  if (probabilities && typeof probabilities === "object" && typeof (probabilities as Record<string, unknown>).yes === "number") {
    return (probabilities as { yes: number }).yes;
  }
  return 0;
}

async function callJev(
  request: ReturnType<typeof buildJevRequest>,
  config: JevRouterConfig,
  fetcher: typeof fetch
): Promise<{ answers: Record<string, unknown>; usage?: unknown } | { error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetcher(config.endpoint ?? DEFAULT_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) return { error: `HTTP ${response.status}` };

    const payload = (await response.json()) as { answers?: Record<string, unknown>; usage?: unknown };
    return { answers: payload.answers ?? {}, usage: payload.usage };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

function thresholdFrom(config: JevRouterConfig) {
  return config.threshold ?? DEFAULT_THRESHOLD;
}

function isCategoryId(id: string): id is CategoryId {
  return categoryDefinitions.some((category) => category.id === id);
}
