import { evaluationSnapshot } from "./evaluation";
import { categories, listPolicyResources } from "./preferences";
import { createPolicyStore, type PolicyStore } from "./policy-store";
import {
  bootstrapInstruction,
  serviceDisplayName,
  serviceEndpoint,
  serviceName,
  serviceVersion,
  supportedProtocols,
  toolCatalog,
} from "./service";

// bearerToken is included on purpose: the dashboard sits behind Microsoft sign-in,
// and Brandon uses it to fetch the token onto a new device. It only ever travels
// in this session-gated response, never in the HTML shell.
export async function createDashboardData(now = new Date(), bearerToken?: string, store: PolicyStore = createPolicyStore()) {
  const policies = await store.list();
  const policyInventory = policies.map((policy) => ({
    ...policy,
    ageDays: Math.max(0, Math.floor((now.getTime() - new Date(policy.reviewedAt).getTime()) / 86_400_000)),
  }));
  const activePolicies = policyInventory.filter(({ kind }) => kind !== "group");
  const resourceRegistry = listPolicyResources().map((resource) => {
    const policy = activePolicies.find(({ id }) => id === resource.id);
    return {
      ...resource,
      activation: policy?.activation ?? "routed",
      version: policy?.version ?? 1,
      reviewedAt: policy?.reviewedAt ?? null,
    };
  });
  return {
    ok: true,
    generatedAt: now.toISOString(),
    service: {
      name: serviceName,
      displayName: serviceDisplayName,
      version: serviceVersion,
      endpoint: serviceEndpoint,
      status: "operational",
      transport: "Streamable HTTP",
      authentication: "Bearer token",
      protocols: supportedProtocols,
      bearerToken: bearerToken ?? null,
    },
    evaluation: evaluationSnapshot,
    tools: toolCatalog,
    categories: policyInventory,
    policyStorage: { durable: store.durable, model: "immutable versions with an active pointer" },
    guidelines: {
      bootstrapInstruction,
      delivery: [
        {
          id: "always",
          label: "Always on",
          description: "Compact baseline guidance included before every task-specific lookup.",
          categoryIds: activePolicies.filter(({ activation }) => activation === "always").map(({ id }) => id),
        },
        {
          id: "routed",
          label: "Routed",
          description: "Selected from task, language, framework, mode, and artifact signals.",
          categoryIds: activePolicies.filter(({ activation }) => activation === "routed").map(({ id }) => id),
        },
        {
          id: "explicit",
          label: "Explicit",
          description: "Loaded only when named directly or invoked as a command workflow.",
          categoryIds: activePolicies.filter(({ activation }) => activation === "explicit").map(({ id }) => id),
        },
      ],
      steps: [
        "Start with the global and communication baseline.",
        "Inspect task context once, then call get_guidance with the known signals.",
        "Add explicit categories to inferred guidance without duplicating the baseline.",
        "Use get_preferences only for a named policy audit; commands stay separate from policy IDs.",
      ],
    },
    resources: {
      sources: [
        {
          id: "policy-files",
          label: "Policy documents",
          type: "Repository",
          location: "mcp/preferences/*.md",
          detail: "Canonical Markdown guidance compiled into the server catalog.",
          state: `${resourceRegistry.length} registered resources`,
        },
        {
          id: "policy-store",
          label: "Active policy versions",
          type: store.durable ? "Cloudflare KV" : "Bundled fallback",
          location: store.durable ? "MCP_POLICIES" : "mcp/catalog.ts",
          detail: "Immutable versions with one active pointer per editable policy.",
          state: store.durable ? "Connected" : "Read-only fallback",
        },
        {
          id: "routing",
          label: "Routing model",
          type: "Repository",
          location: "mcp/routing.ts",
          detail: "Keyword, language, framework, mode, and explicit-category selection.",
          state: `${evaluationSnapshot.corpus.routingChecks} checks`,
        },
        {
          id: "evaluation",
          label: "Evaluation snapshot",
          type: "Build artifact",
          location: "mcp/evaluation.ts",
          detail: "Deterministic payload measurements and retained answer-study results.",
          state: `Measured ${evaluationSnapshot.evaluatedAt}`,
        },
        {
          id: "protocol",
          label: "MCP contract",
          type: "Runtime",
          location: serviceEndpoint,
          detail: "Tools, prompts, and personal:// resources served over Streamable HTTP.",
          state: `${supportedProtocols.length} protocol versions`,
        },
      ],
      registry: resourceRegistry,
    },
    connections: [
      {
        id: "codex",
        label: "Codex",
        mark: "CX",
        support: "recommended",
        summary: "Shared CLI and IDE configuration with native bearer-token environment support.",
        caveat: "Recommended path. The CLI and IDE extension read the same configuration.",
        filename: "~/.codex/config.toml",
        source: "https://developers.openai.com/codex/mcp/",
        code: `[mcp_servers.brandoriv]\nurl = "${serviceEndpoint}"\nbearer_token_env_var = "MCP_BEARER_TOKEN"`,
      },
      {
        id: "cursor",
        label: "Cursor",
        mark: "CU",
        support: "recommended",
        summary: "Native Streamable HTTP support in workspace or global mcp.json.",
        caveat: "Cloud Agents support HTTP servers; legacy SSE and local bridge packages are desktop-only.",
        filename: "~/.cursor/mcp.json",
        source: "https://cursor.com/docs/mcp",
        code: `{
  "mcpServers": {
    "brandoriv": {
      "url": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer \${env:MCP_BEARER_TOKEN}"
      }
    }
  }
}`,
      },
      {
        id: "claude-code",
        label: "Claude Code",
        mark: "A",
        support: "recommended",
        summary: "Native remote HTTP support through the Claude Code MCP CLI.",
        caveat: "Use HTTP explicitly; legacy SSE remains a fallback but is deprecated.",
        filename: "Terminal",
        source: "https://code.claude.com/docs/en/mcp",
        code: `claude mcp add --transport http brandoriv ${serviceEndpoint} \\
  --header "Authorization: Bearer \${MCP_BEARER_TOKEN}"`,
      },
      {
        id: "vscode",
        label: "VS Code + Copilot",
        mark: "<>\u200b",
        support: "supported",
        summary: "Native HTTP servers in Agent mode with a prompted secret input.",
        caveat: "Local VS Code is fully supported. GitHub cloud agents require separately configured repository secrets.",
        filename: ".vscode/mcp.json",
        source: "https://code.visualstudio.com/docs/agent-customization/mcp-servers",
        code: `{
  "servers": {
    "brandoriv": {
      "type": "http",
      "url": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer \${input:brandoriv-token}"
      }
    }
  },
  "inputs": [{
    "id": "brandoriv-token",
    "type": "promptString",
    "description": "brandoriv.mcp bearer token",
    "password": true
  }]
}`,
      },
      {
        id: "gemini-cli",
        label: "Gemini CLI",
        mark: "✦",
        support: "supported",
        summary: "Streamable HTTP through project or user settings.json.",
        caveat: "Bearer headers work directly. OAuth browser flows are limited in headless or remote shells.",
        filename: ".gemini/settings.json",
        source: "https://geminicli.com/docs/tools/mcp-server/",
        code: `{
  "mcpServers": {
    "brandoriv": {
      "httpUrl": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer $MCP_BEARER_TOKEN"
      }
    }
  }
}`,
      },
      {
        id: "cline",
        label: "Cline",
        mark: "CL",
        support: "supported",
        summary: "Remote Streamable HTTP through Cline's MCP configuration.",
        caveat: "Set type to streamableHttp; omitting it falls back to legacy SSE. Replace the token placeholder locally.",
        filename: "~/.cline/mcp.json",
        source: "https://docs.cline.bot/mcp/mcp-overview",
        code: `{
  "mcpServers": {
    "brandoriv": {
      "type": "streamableHttp",
      "url": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer <MCP_BEARER_TOKEN>"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}`,
      },
      {
        id: "copilot-cli",
        label: "GitHub Copilot CLI",
        mark: "GH",
        support: "supported",
        summary: "Remote HTTP through the portable Copilot MCP configuration.",
        caveat: "Repository cloud agents only expose MCP tools and require COPILOT_MCP_ secrets for private headers.",
        filename: "~/.copilot/mcp-config.json",
        source: "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers",
        code: `{
  "mcpServers": {
    "brandoriv": {
      "type": "http",
      "url": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer $MCP_BEARER_TOKEN"
      },
      "tools": ["*"]
    }
  }
}`,
      },
      {
        id: "zed",
        label: "Zed",
        mark: "Z",
        support: "limited",
        summary: "Remote server support with custom headers.",
        caveat: "Zed currently exposes MCP tools and prompts, but not the personal:// resources shown in this dashboard.",
        filename: "~/.config/zed/settings.json",
        source: "https://zed.dev/docs/ai/mcp",
        code: `{
  "context_servers": {
    "brandoriv": {
      "url": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer <MCP_BEARER_TOKEN>"
      }
    }
  }
}`,
      },
      {
        id: "windsurf",
        label: "Windsurf / Devin",
        mark: "W",
        support: "supported",
        summary: "Remote HTTP configuration for Cascade-compatible clients.",
        caveat: "Windsurf's current documentation redirects toward Devin Desktop; its newer local agent may use a separate configuration.",
        filename: "~/.codeium/windsurf/mcp_config.json",
        source: "https://docs.windsurf.com/windsurf/cascade/mcp",
        code: `{
  "mcpServers": {
    "brandoriv": {
      "serverUrl": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer \${env:MCP_BEARER_TOKEN}"
      }
    }
  }
}`,
      },
      {
        id: "jetbrains",
        label: "JetBrains AI",
        mark: "JB",
        support: "limited",
        summary: "Remote Streamable HTTP is supported, but private-header setup is not documented.",
        caveat: "Bearer authentication remains unverified in the official client documentation, so this connection is not ready to recommend.",
        configurationReady: false,
        filename: "Not yet supported",
        source: "https://www.jetbrains.com/help/ai-assistant/mcp.html",
        code: "Remote HTTP is available, but brandoriv.mcp requires a bearer header and the official JetBrains documentation does not currently document custom Authorization headers.",
      },
    ],
  };
}
