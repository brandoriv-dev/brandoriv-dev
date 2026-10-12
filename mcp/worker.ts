import { isLedgerPath, proxyLedgerRequest } from "./harness";

interface Env {
  ASSETS: Fetcher;
  LEDGER_ORIGIN?: string;
}

const mossSecurityHeaders = {
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // The personal MCP server was retired on 2026-10-12. Keep a permanent tombstone
    // so old clients get a definitive answer instead of a portfolio 404 page.
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      return new Response(request.method === "HEAD" ? null : "This MCP service has been retired.\n", {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      });
    }

    if (isLedgerPath(url.pathname)) {
      return proxyLedgerRequest(request, env.LEDGER_ORIGIN);
    }

    if (url.pathname === "/moss" || url.pathname.startsWith("/moss/")) {
      return serveMossCatalog(request, env.ASSETS);
    }

    return env.ASSETS.fetch(request);
  },
};

async function serveMossCatalog(request: Request, assets: Fetcher): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return methodNotAllowed("GET, HEAD");
  const url = new URL(request.url);
  if (url.pathname === "/moss") {
    url.pathname = "/moss/";
    return new Response(null, { status: 308, headers: { Location: url.pathname + url.search, "Cache-Control": "no-store" } });
  }
  // Let the asset binding resolve the directory index. Rewriting /moss/ to
  // /moss/index.html conflicts with Cloudflare's canonical redirect back to
  // /moss/ and creates a redirect loop.
  const response = await assets.fetch(new Request(url, request));
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(mossSecurityHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function methodNotAllowed(allow: string): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allow, "Cache-Control": "no-store" },
  });
}
