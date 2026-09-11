export const harnessPath = "/harness";
export const harnessPublicOrigin = "https://brandoriv.dev";

type HarnessFetch = (request: Request, init?: RequestInit) => Promise<Response>;

const hopByHopHeaders = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
]);

export function isHarnessPath(pathname: string): boolean {
  return pathname === harnessPath || pathname.startsWith(`${harnessPath}/`);
}

/**
 * Azure owns authentication and application state. This edge only transports requests.
 * EasyAuth must use /harness/.auth and Custom forward-proxy host/proto headers below.
 * Preserve the path so the OAuth callback used for code redemption stays identical
 * to the public redirect URI; do not rewrite OAuth state or redirect_uri parameters.
 */
export async function proxyHarnessRequest(
  request: Request,
  configuredOrigin?: string,
  fetchUpstream: HarnessFetch = fetch,
): Promise<Response> {
  const incomingUrl = new URL(request.url);
  if (!isHarnessPath(incomingUrl.pathname)) return unavailable(404, "Not found.");

  const origin = azureOrigin(configuredOrigin);
  if (!origin) return unavailable(503, "Harness is not configured.");

  // Cookies and Entra callbacks belong to one canonical HTTPS hostname.
  if (incomingUrl.origin !== harnessPublicOrigin) {
    const canonical = new URL(harnessPublicOrigin);
    canonical.pathname = incomingUrl.pathname;
    canonical.search = incomingUrl.search;
    return new Response(null, {
      status: 308,
      headers: { Location: canonical.href, "Cache-Control": "no-store" },
    });
  }

  const upstreamUrl = new URL(origin);
  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;
  const headers = upstreamHeaders(request.headers, upstreamUrl.host);
  // Construct from the incoming Request to stream POST bodies without buffering
  // them or changing form_post authentication callbacks.
  const forwarded = new Request(upstreamUrl, request);
  const upstreamRequest = new Request(forwarded, { headers, redirect: "manual", cache: "no-store" });

  let response: Response;
  try {
    response = await fetchUpstream(upstreamRequest, {
      redirect: "manual",
      cache: "no-store",
      // workerd rejects cf.cacheTtl together with cache: no-store, even at zero.
      // The standard no-store option already bypasses the upstream cache.
    });
  } catch {
    // Do not expose Azure hostnames, request headers, or network exception details.
    return unavailable(502, "Harness is temporarily unavailable.");
  }

  const responseHeaders = new Headers(response.headers);
  removeHopByHopHeaders(responseHeaders);
  responseHeaders.set("Cache-Control", "private, no-store");
  responseHeaders.set("CDN-Cache-Control", "no-store");
  responseHeaders.set("Cloudflare-CDN-Cache-Control", "no-store");
  responseHeaders.set("Referrer-Policy", "no-referrer");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  // No alternate cache lifetime may expose a session or authenticated response.
  responseHeaders.delete("Expires");
  responseHeaders.delete("Surrogate-Control");

  const location = response.headers.get("Location");
  if (location) responseHeaders.set("Location", publicLocation(location, upstreamUrl));

  // Set-Cookie cannot be split on commas: Expires attributes contain commas.
  const cookies = response.headers.getSetCookie();
  responseHeaders.delete("Set-Cookie");
  for (const cookie of cookies) {
    responseHeaders.append("Set-Cookie", publicCookie(cookie, upstreamUrl.hostname));
  }

  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

function azureOrigin(value?: string): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.pathname !== "/" || url.search || url.hash ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.azurewebsites\.net$/.test(url.hostname)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function removeHopByHopHeaders(headers: Headers): void {
  const connectionTokens = (headers.get("Connection") ?? "").split(",").map((value) => value.trim());
  for (const name of connectionTokens) if (name) headers.delete(name);
  for (const name of hopByHopHeaders) headers.delete(name);
}

function upstreamHeaders(incoming: Headers, azureHost: string): Headers {
  const headers = new Headers(incoming);
  removeHopByHopHeaders(headers);
  for (const name of [...headers.keys()]) {
    const lower = name.toLowerCase();
    // Only Azure EasyAuth may inject its principal and token identity headers.
    // Discard caller-selected forwarding conventions before setting our own.
    if (lower.startsWith("x-ms-") || lower.startsWith("x-arr-") ||
      lower.startsWith("x-forwarded-") || lower.startsWith("x-original-") ||
      lower.startsWith("x-harness-forwarded-") || lower.startsWith("cf-access-") ||
      lower === "forwarded" || lower === "x-zumo-auth") {
      headers.delete(name);
    }
  }

  // MCP's __Host session cookie has Path=/ and otherwise reaches this route.
  // Only Azure session/nonce/affinity cookies need to leave the website's Worker.
  const azureCookies = (incoming.get("Cookie") ?? "").split(";").map((value) => value.trim()).filter((value) => {
    const separator = value.indexOf("=");
    if (separator <= 0) return false;
    const name = value.slice(0, separator);
    return /^AppServiceAuth[A-Za-z0-9_-]*$/.test(name) || /^ARRAffinity(?:SameSite)?$/.test(name);
  });
  if (azureCookies.length) headers.set("Cookie", azureCookies.join("; "));
  else headers.delete("Cookie");
  headers.set("Host", azureHost);
  headers.set("X-Harness-Forwarded-Host", "brandoriv.dev");
  headers.set("X-Harness-Forwarded-Proto", "https");
  headers.set("Cache-Control", "no-store");
  return headers;
}

function publicLocation(location: string, upstreamUrl: URL): string {
  let target: URL;
  try { target = new URL(location, upstreamUrl); }
  catch { return location; }
  if (target.origin !== upstreamUrl.origin && target.origin !== harnessPublicOrigin) return location;
  const publicUrl = new URL(harnessPublicOrigin);
  publicUrl.pathname = isHarnessPath(target.pathname) ? target.pathname : `${harnessPath}${target.pathname}`;
  publicUrl.search = target.search;
  publicUrl.hash = target.hash;
  return publicUrl.href;
}

function publicCookie(cookie: string, azureHost: string): string {
  const [nameAndValue, ...attributes] = cookie.split(";");
  const kept = attributes.map((attribute) => attribute.trim()).filter((attribute) => {
    const separator = attribute.indexOf("=");
    const name = (separator < 0 ? attribute : attribute.slice(0, separator)).trim().toLowerCase();
    const value = separator < 0 ? "" : attribute.slice(separator + 1).trim();
    if (name === "path") return false;
    if (name === "domain" && value.replace(/^\./, "").toLowerCase() === azureHost) return false;
    return attribute.length > 0;
  });
  // Narrow all upstream cookies, including nonce deletion cookies, to this app.
  kept.push(`Path=${harnessPath}`);
  if (!kept.some((attribute) => attribute.toLowerCase() === "secure")) kept.push("Secure");
  return [nameAndValue, ...kept].join("; ");
}

function unavailable(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
