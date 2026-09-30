import { createMcpHandler } from "agents/mcp/server";
import {
  bearerTokenFrom,
  clearDashboardSessionCookie,
  createDashboardSessionCookie,
  hasValidDashboardSession,
  secureTokenEquals,
} from "./dashboard-auth";
import { createDashboardData } from "./dashboard";
import {
  OidcError,
  beginMicrosoftLogin,
  clearOidcStateCookie,
  exchangeCodeForIdToken,
  fetchJwks,
  isAllowedEmail,
  readOidcState,
  validateIdToken,
} from "./microsoft-auth";
import { createPersonalContextServer } from "./server";
import { serviceEndpoint, serviceName, serviceVersion, supportedProtocols } from "./service";
import { isHarnessPath, isLedgerPath, proxyHarnessRequest, proxyLedgerRequest } from "./harness";
import { createPolicyStore } from "./policy-store";
import { createEventLogger } from "./event-log";
import type { JevRouterConfig } from "./jev-router";

interface Env {
  ASSETS: Fetcher;
  MCP_RETIRED?: string;
  MCP_BEARER_TOKEN?: string;
  HARNESS_ORIGIN?: string;
  LEDGER_ORIGIN?: string;
  // Dashboard sign-in with a personal Microsoft account. The client id and the
  // allowlist are plain vars in wrangler.jsonc; the secret is a Cloudflare secret.
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  DASHBOARD_ALLOWED_EMAILS?: string;
  MCP_POLICIES?: KVNamespace;
  TYPESAFE_API_KEY?: string;
  TYPESAFE_ENDPOINT?: string;
  TYPESAFE_MODEL?: string;
  JEV_ROUTING_MODE?: "off" | "shadow";
  JEV_ROUTE_THRESHOLD?: string;
  JEV_SEND_RAW_TASK?: string;
  JEV_TIMEOUT_MS?: string;
  BSTACK_TOOLS_EVENT_ENDPOINT?: string;
  BSTACK_TOOLS_EVENT_TOKEN?: string;
}

const mcpHandlerOptions = {
  route: "/mcp",
  allowedHostnames: ["brandoriv.dev", "www.brandoriv.dev", "localhost", "127.0.0.1"],
  // Non-browser MCP clients omit Origin. Present browser Origins stay limited to
  // the dashboard's own hosts, as required by the Streamable HTTP specification.
  allowedOriginHostnames: ["brandoriv.dev", "www.brandoriv.dev", "localhost", "127.0.0.1"],
  corsOptions: {
    origin: "*",
  },
  legacy: "stateless" as const,
};

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

    if (env.MCP_RETIRED === "true" && (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/"))) {
      return new Response(request.method === "HEAD" ? null : "This MCP service has been retired.\n", {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      });
    }

    if (isHarnessPath(url.pathname)) {
      return proxyHarnessRequest(request, env.HARNESS_ORIGIN);
    }

    if (isLedgerPath(url.pathname)) {
      return proxyLedgerRequest(request, env.LEDGER_ORIGIN);
    }

    if (url.pathname === "/moss" || url.pathname === "/moss/" || url.pathname.startsWith("/moss/")) {
      return serveMossCatalog(request, env.ASSETS);
    }

    if (url.pathname === "/mcp/health") {
      return Response.json({
        ok: true,
        service: serviceName,
        version: serviceVersion,
        protocols: supportedProtocols,
      });
    }

    if (url.pathname === "/mcp/auth/login") {
      return handleMicrosoftLogin(request, env);
    }

    if (url.pathname === "/mcp/auth/callback") {
      return handleMicrosoftCallback(request, env);
    }

    if (url.pathname === "/mcp/dashboard/session") {
      return handleDashboardSession(request, env.MCP_BEARER_TOKEN);
    }

    if (url.pathname === "/mcp/dashboard/data") {
      return handleDashboardData(request, env.MCP_BEARER_TOKEN, env.MCP_POLICIES);
    }

    if (url.pathname.startsWith("/mcp/dashboard/policies/")) {
      return handleDashboardPolicy(request, env.MCP_BEARER_TOKEN, env.MCP_POLICIES);
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
      return createMcpHandler(
        () =>
          createPersonalContextServer(createPolicyStore(env.MCP_POLICIES), {
            eventLogger: createEventLogger(
              {
                endpoint: env.BSTACK_TOOLS_EVENT_ENDPOINT,
                token: env.BSTACK_TOOLS_EVENT_TOKEN,
              },
              ctx
            ),
            jev: jevConfigFromEnv(env),
            waitUntil: (promise) => ctx.waitUntil(promise),
          }),
        mcpHandlerOptions
      )(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};

function jevConfigFromEnv(env: Env): JevRouterConfig {
  return {
    mode: env.JEV_ROUTING_MODE === "shadow" ? "shadow" : "off",
    apiKey: env.TYPESAFE_API_KEY,
    endpoint: env.TYPESAFE_ENDPOINT,
    model: env.TYPESAFE_MODEL,
    threshold: numberFromEnv(env.JEV_ROUTE_THRESHOLD),
    sendRawTask: env.JEV_SEND_RAW_TASK === "1",
    timeoutMs: numberFromEnv(env.JEV_TIMEOUT_MS),
  };
}

function numberFromEnv(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function serveMossCatalog(request: Request, assets: Fetcher): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return methodNotAllowed("GET, HEAD");
  const url = new URL(request.url);
  if (url.pathname === "/moss") {
    url.pathname = "/moss/";
    return new Response(null, { status: 308, headers: { Location: url.pathname + url.search, "Cache-Control": "no-store" } });
  }
  // Let the asset binding resolve the directory index. Rewriting /moss/ to
  // /moss/index.html conflicts with Cloudflare's canonical redirect back to
  // /moss/ and creates an authenticated redirect loop.
  const response = await assets.fetch(new Request(url, request));
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(dashboardSecurityHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

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

async function handleMicrosoftLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  if (!env.MCP_BEARER_TOKEN || !env.MICROSOFT_CLIENT_ID) {
    return jsonError("Microsoft sign-in is not configured.", 503);
  }

  const { redirectUrl, setCookie } = await beginMicrosoftLogin({
    clientId: env.MICROSOFT_CLIENT_ID,
    redirectUri: callbackUrl(request),
    signingSecret: env.MCP_BEARER_TOKEN,
    returnTo: new URL(request.url).searchParams.get("next") ?? undefined,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: redirectUrl, "Set-Cookie": setCookie, "Cache-Control": "no-store" },
  });
}

async function handleMicrosoftCallback(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  if (!env.MCP_BEARER_TOKEN || !env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET || !env.DASHBOARD_ALLOWED_EMAILS) {
    return jsonError("Microsoft sign-in is not configured.", 503);
  }

  const url = new URL(request.url);
  const stateCookie = await readOidcState(request.headers.get("Cookie"), env.MCP_BEARER_TOKEN);
  if (!stateCookie) return dashboardRedirect("expired");

  // The user cancelled at Microsoft, or Microsoft refused.
  if (url.searchParams.has("error")) return dashboardRedirect("denied", stateCookie.returnTo);

  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  if (!state || !code || !(await secureTokenEquals(state, stateCookie.state))) return dashboardRedirect("denied", stateCookie.returnTo);

  try {
    const idToken = await exchangeCodeForIdToken({
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      code,
      redirectUri: callbackUrl(request),
      verifier: stateCookie.verifier,
    });
    const claims = await validateIdToken(idToken, {
      audience: env.MICROSOFT_CLIENT_ID,
      nonce: stateCookie.nonce,
      keys: await fetchJwks(),
    });

    if (!isAllowedEmail(claims, env.DASHBOARD_ALLOWED_EMAILS)) {
      console.warn("dashboard sign-in refused", { oid: claims.oid, email: claims.email ?? claims.preferred_username });
      return dashboardRedirect("denied");
    }

    // Logged so the account can be pinned by oid later, which is stronger than email.
    console.info("dashboard sign-in", { oid: claims.oid, email: claims.email ?? claims.preferred_username });

    // Land on our origin before using the Strict session cookie; keep the signed
    // destination in the URL so the browser return needs neither storage nor rendering.
    const destination = stateCookie.returnTo === "/moss" ? "/mcp?next=%2Fmoss" : "/mcp";
    const headers = new Headers({ Location: destination, "Cache-Control": "no-store" });
    headers.append("Set-Cookie", await createDashboardSessionCookie(env.MCP_BEARER_TOKEN));
    headers.append("Set-Cookie", clearOidcStateCookie());
    return new Response(null, { status: 302, headers });
  } catch (error) {
    const reason = error instanceof OidcError ? error.reason : "invalid";
    console.warn("dashboard sign-in failed", { reason, message: error instanceof Error ? error.message : String(error) });
    return dashboardRedirect(reason === "unavailable" ? "unavailable" : reason === "expired" ? "expired" : "denied", stateCookie.returnTo);
  }
}

// Fixed, not derived from the request: it must byte-match the redirect URI in the
// Entra app registration, and request hosts are rewritten under wrangler dev.
function callbackUrl(_request: Request): string {
  return `${serviceEndpoint}/auth/callback`;
}

function dashboardRedirect(login: "expired" | "denied" | "unavailable", returnTo?: "/mcp" | "/moss"): Response {
  const headers = new Headers({ Location: `/mcp?login=${login}${returnTo === "/moss" ? "&next=%2Fmoss" : ""}`, "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearOidcStateCookie());
  return new Response(null, { status: 302, headers });
}

async function handleDashboardData(request: Request, expectedToken?: string, kv?: KVNamespace): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  if (!expectedToken) return jsonError("Dashboard authentication is not configured.", 503);
  if (!(await hasValidDashboardSession(request, expectedToken))) return jsonError("Unauthorized", 401);

  return Response.json(await createDashboardData(new Date(), expectedToken, createPolicyStore(kv)), {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

async function handleDashboardPolicy(request: Request, expectedToken?: string, kv?: KVNamespace): Promise<Response> {
  if (!expectedToken || !(await hasValidDashboardSession(request, expectedToken))) return jsonError("Unauthorized", 401);
  const id = decodeURIComponent(new URL(request.url).pathname.split("/").pop() ?? "");
  const store = createPolicyStore(kv);
  if (request.method === "GET") return Response.json({ ok: true, versions: await store.versions(id) });
  if (request.method !== "PUT") return methodNotAllowed("GET, PUT");
  if (!kv) return jsonError("Durable policy storage is not configured.", 503);
  const body = JSON.parse(await readLimitedText(request, 128 * 1024)) as Record<string, unknown>;
  const current = (await store.list()).find((item) => item.id === id);
  if (!current) return jsonError("Unknown policy.", 404);
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const changeNote = typeof body.changeNote === "string" ? body.changeNote.trim() : "";
  if (!content || !changeNote) return jsonError("Content and a change note are required.", 400);
  const saved = await store.save({ ...current, content, changeNote });
  return Response.json({ ok: true, policy: saved }, { status: 201 });
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
