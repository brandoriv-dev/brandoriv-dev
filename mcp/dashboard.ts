import { evaluationSnapshot } from "./evaluation";
import { categories } from "./preferences";
import {
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
export function createDashboardData(now = new Date(), bearerToken?: string) {
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
    categories: categories.map(({ id, title, content }) => ({ id, title, content: content.trim() })),
    connections: [
      {
        id: "codex",
        label: "Codex",
        filename: "~/.codex/config.toml",
        source: "https://learn.chatgpt.com/docs/extend/mcp?surface=cli",
        code: `[mcp_servers.brandoriv]\nurl = "${serviceEndpoint}"\nbearer_token_env_var = "MCP_BEARER_TOKEN"`,
      },
      {
        id: "claude",
        label: "Claude Code",
        filename: ".mcp.json",
        source: "https://code.claude.com/docs/en/mcp",
        code: `{
  "mcpServers": {
    "brandoriv": {
      "type": "http",
      "url": "${serviceEndpoint}",
      "headers": {
        "Authorization": "Bearer \${MCP_BEARER_TOKEN}"
      }
    }
  }
}`,
      },
    ],
  };
}
