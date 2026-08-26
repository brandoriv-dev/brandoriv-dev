import { createMcpHandler } from "agents/mcp/server";
import { createPersonalContextServer } from "./server";

interface Env {
  ASSETS: Fetcher;
  MCP_BEARER_TOKEN?: string;
}

const mcpHandler = createMcpHandler(createPersonalContextServer, {
  route: "/mcp",
  allowedHostnames: ["brandoriv.dev", "www.brandoriv.dev", "localhost", "127.0.0.1"],
  allowedOriginHostnames: ["brandoriv.dev", "www.brandoriv.dev", "localhost", "127.0.0.1"],
  corsOptions: {
    origin: "https://brandoriv.dev",
  },
  legacy: "reject",
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/mcp/health") {
      return Response.json({ ok: true, service: "brandoriv-personal-context" });
    }

    if (url.pathname === "/mcp") {
      const authResponse = await requireBearerToken(request, env.MCP_BEARER_TOKEN);
      if (authResponse) return authResponse;
      return mcpHandler(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};

async function requireBearerToken(request: Request, expectedToken?: string): Promise<Response | null> {
  if (!expectedToken) {
    return new Response("MCP_BEARER_TOKEN is not configured.", { status: 503 });
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const actualToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!actualToken || !(await secureTokenEquals(actualToken, expectedToken))) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer realm="brandoriv.dev/mcp"',
        "Cache-Control": "no-store",
      },
    });
  }

  return null;
}

async function secureTokenEquals(actual: string, expected: string): Promise<boolean> {
  const actualHash = await sha256(actual);
  const expectedHash = await sha256(expected);
  return actualHash === expectedHash;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
