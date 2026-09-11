import { createMcpHandler } from "agents/mcp/server";
import {
  bearerTokenFrom,
  clearDashboardSessionCookie,
  createDashboardSessionCookie,
  hasValidDashboardSession,
  secureTokenEquals,
} from "./dashboard-auth";
import { createDashboardData } from "./dashboard";
import { createPersonalContextServer } from "./server";
import { serviceName, serviceVersion, supportedProtocols } from "./service";
import { isHarnessPath, proxyHarnessRequest } from "./harness";

interface Env {
  ASSETS: Fetcher;
  MCP_BEARER_TOKEN?: string;
  HARNESS_ORIGIN?: string;
}

const mcpHandler = createMcpHandler(createPersonalContextServer, {
  route: "/mcp",
  allowedHostnames: ["brandoriv.dev", "www.brandoriv.dev", "localhost", "127.0.0.1"],
  // Non-browser MCP clients omit Origin. Present browser Origins stay limited to
  // the dashboard's own hosts, as required by the Streamable HTTP specification.
  allowedOriginHostnames: ["brandoriv.dev", "www.brandoriv.dev", "localhost", "127.0.0.1"],
  corsOptions: {
    origin: "*",
  },
  legacy: "stateless",
});

// "/mcp" itself is negotiated by content type, since MCP clients share that path.
const dashboardAliasPaths = new Set(["/mcp/", "/mcp/index.html"]);
const maxDashboardLoginBytes = 8192;

const dashboardSecurityHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (isHarnessPath(url.pathname)) {
      return proxyHarnessRequest(request, env.HARNESS_ORIGIN);
    }

    if (url.pathname === "/mcp/health") {
      return Response.json({
        ok: true,
        service: serviceName,
        version: serviceVersion,
        protocols: supportedProtocols,
      });
    }

    if (url.pathname === "/mcp/dashboard/session") {
      return handleDashboardSession(request, env.MCP_BEARER_TOKEN);
    }

    if (url.pathname === "/mcp/dashboard/data") {
      return handleDashboardData(request, env.MCP_BEARER_TOKEN);
    }

    const wantsDashboardDocument =
      url.pathname === "/mcp"
        ? isDashboardDocumentRequest(request)
        : dashboardAliasPaths.has(url.pathname) &&
          (request.method === "GET" || request.method === "HEAD");
    if (wantsDashboardDocument) {
      return serveDashboard(request, env.ASSETS);
    }

    if (url.pathname === "/mcp") {
      if (request.method !== "OPTIONS") {
        const authResponse = await requireBearerToken(request, env.MCP_BEARER_TOKEN);
        if (authResponse) return authResponse;
      }
      return mcpHandler(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};

async function requireBearerToken(request: Request, expectedToken?: string): Promise<Response | null> {
  if (!expectedToken) {
    return new Response("MCP_BEARER_TOKEN is not configured.", { status: 503 });
  }

  const actualToken = bearerTokenFrom(request);
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

async function handleDashboardSession(request: Request, expectedToken?: string): Promise<Response> {
  if (request.method === "DELETE") {
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": clearDashboardSessionCookie(), "Cache-Control": "no-store" },
    });
  }

  if (request.method !== "POST") return methodNotAllowed("POST, DELETE");
  if (!expectedToken) return jsonError("Dashboard authentication is not configured.", 503);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return jsonError("Expected application/json.", 415);
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxDashboardLoginBytes) {
    return jsonError("Request body is too large.", 413);
  }

  let bodyText: string;
  try {
    bodyText = await readLimitedText(request, maxDashboardLoginBytes);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return jsonError("Request body is too large.", 413);
    return jsonError("Invalid request body.", 400);
  }

  let token: unknown;
  try {
    token = (JSON.parse(bodyText) as { token?: unknown }).token;
  } catch {
    return jsonError("Invalid JSON.", 400);
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 4096) {
    return jsonError("Unauthorized", 401);
  }
  if (!(await secureTokenEquals(token, expectedToken))) return jsonError("Unauthorized", 401);

  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": await createDashboardSessionCookie(expectedToken),
      "Cache-Control": "no-store",
    },
  });
}

async function handleDashboardData(request: Request, expectedToken?: string): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  if (!expectedToken) return jsonError("Dashboard authentication is not configured.", 503);
  if (!(await hasValidDashboardSession(request, expectedToken))) return jsonError("Unauthorized", 401);

  return Response.json(createDashboardData(), {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function isDashboardDocumentRequest(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  const fetchDestination = request.headers.get("Sec-Fetch-Dest")?.toLowerCase();
  if (fetchDestination && fetchDestination !== "document") return false;

  const accept = request.headers.get("Accept") ?? "";
  return acceptsMediaType(accept, "text/html") && !acceptsMediaType(accept, "text/event-stream");
}

function acceptsMediaType(accept: string, expectedType: string): boolean {
  return accept.split(",").some((range) => {
    const [rawType, ...parameters] = range.split(";");
    if (rawType.trim().toLowerCase() !== expectedType) return false;

    const qualityParameter = parameters.find((parameter) => /^q\s*=/i.test(parameter.trim()));
    if (!qualityParameter) return true;
    const quality = Number(qualityParameter.split("=", 2)[1]?.trim());
    return Number.isFinite(quality) && quality > 0;
  });
}

class RequestBodyTooLargeError extends Error {}

async function readLimitedText(request: Request, maximumBytes: number): Promise<string> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    if (!value) continue;

    bytesRead += value.byteLength;
    if (bytesRead > maximumBytes) {
      await reader.cancel().catch(() => undefined);
      throw new RequestBodyTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }
}

async function serveDashboard(request: Request, assets: Fetcher): Promise<Response> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/mcp/";
  const assetRequest = new Request(assetUrl, request);
  const response = await assets.fetch(assetRequest);
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(dashboardSecurityHeaders)) headers.set(name, value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonError(message: string, status: number): Response {
  return Response.json(
    { ok: false, error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }
  );
}

function methodNotAllowed(allow: string): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allow, "Cache-Control": "no-store" },
  });
}
