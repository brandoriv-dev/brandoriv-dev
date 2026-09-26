// Microsoft personal-account sign-in for the dashboard: OpenID Connect
// authorization-code flow with PKCE. This only changes what earns the dashboard
// session cookie. MCP clients keep bearer auth on /mcp and are not involved.
//
// Endpoints are pinned from the consumers discovery document
// (https://login.microsoftonline.com/consumers/v2.0/.well-known/openid-configuration).
// Only the signing keys are fetched at runtime, because those rotate.
//
// This module has no internal imports so the unit test can load it under Node's
// type stripping, which requires explicit extensions the Worker bundle does not use.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const microsoftAuthorizeEndpoint = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize";
export const microsoftTokenEndpoint = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
export const microsoftJwksUri = "https://login.microsoftonline.com/consumers/discovery/v2.0/keys";
// The fixed tenant id Microsoft uses for every personal account.
export const microsoftConsumerIssuer = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0";

export const oidcStateCookieName = "__Host-brandoriv_mcp_oidc";
export const oidcStateMaxAgeSeconds = 10 * 60;
const clockSkewSeconds = 60;

export interface Jwk {
  kid?: string;
  kty: string;
  n: string;
  e: string;
  use?: string;
  alg?: string;
}

export interface IdTokenClaims {
  iss: string;
  aud: string;
  exp: number;
  iat?: number;
  nbf?: number;
  nonce?: string;
  sub: string;
  oid?: string;
  tid?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

interface OidcStatePayload {
  returnTo?: "/mcp" | "/moss";
  state: string;
  nonce: string;
  verifier: string;
  exp: number;
}

export type OidcFailure = "expired" | "denied" | "invalid" | "unavailable";

export class OidcError extends Error {
  readonly reason: OidcFailure;

  constructor(message: string, reason: OidcFailure) {
    super(message);
    this.reason = reason;
  }
}

// ---------------------------------------------------------------------------
// Step 1: redirect the browser to Microsoft.

export async function beginMicrosoftLogin(options: {
  clientId: string;
  redirectUri: string;
  signingSecret: string;
  returnTo?: string;
  now?: number;
}): Promise<{ redirectUrl: string; setCookie: string }> {
  const state = randomBase64Url(32);
  const nonce = randomBase64Url(32);
  const verifier = randomBase64Url(48);
  const challenge = base64UrlEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
  const exp = Math.floor((options.now ?? Date.now()) / 1000) + oidcStateMaxAgeSeconds;

  const payload: OidcStatePayload = { state, nonce, verifier, exp, returnTo: options.returnTo === "/moss" ? "/moss" : "/mcp" };
  const setCookie = await createOidcStateCookie(payload, options.signingSecret);

  const url = new URL(microsoftAuthorizeEndpoint);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return { redirectUrl: url.toString(), setCookie };
}

// ---------------------------------------------------------------------------
// Step 2: the browser comes back with a code.

export async function readOidcState(
  cookieHeader: string | null,
  signingSecret: string,
  now = Date.now()
): Promise<OidcStatePayload | undefined> {
  const value = readCookie(cookieHeader, oidcStateCookieName);
  const match = value?.match(/^([A-Za-z0-9_-]+)\.([a-f0-9]{64})$/);
  if (!match) return undefined;

  const expectedSignature = await hmacHex(match[1], signingSecret);
  if (!(await secureTokenEquals(match[2], expectedSignature))) return undefined;

  let payload: OidcStatePayload;
  try {
    payload = JSON.parse(decoder.decode(base64UrlDecode(match[1])));
  } catch {
    return undefined;
  }
  if (typeof payload.state !== "string" || typeof payload.nonce !== "string" || typeof payload.verifier !== "string") {
    return undefined;
  }
  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(now / 1000)) return undefined;
  if (payload.returnTo !== undefined && payload.returnTo !== "/mcp" && payload.returnTo !== "/moss") return undefined;
  return payload;
}

export function clearOidcStateCookie(): string {
  return `${oidcStateCookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function exchangeCodeForIdToken(options: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  verifier: string;
  fetcher?: typeof fetch;
}): Promise<string> {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectUri,
    code_verifier: options.verifier,
    scope: "openid email profile",
  });

  const response = await (options.fetcher ?? fetch)(microsoftTokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });

  const json = (await response.json().catch(() => null)) as { id_token?: unknown; error?: unknown } | null;
  if (!response.ok || typeof json?.id_token !== "string") {
    throw new OidcError(`Token exchange failed: ${String(json?.error ?? response.status)}`, "denied");
  }
  return json.id_token;
}

// ---------------------------------------------------------------------------
// Step 3: prove the id_token is Microsoft's, for this app, for this login.

export async function validateIdToken(
  idToken: string,
  options: { audience: string; nonce: string; keys: Jwk[]; issuer?: string; now?: number }
): Promise<IdTokenClaims> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new OidcError("Malformed id_token.", "invalid");
  const [headerPart, payloadPart, signaturePart] = parts;

  let header: { alg?: string; kid?: string };
  let claims: IdTokenClaims;
  try {
    header = JSON.parse(decoder.decode(base64UrlDecode(headerPart)));
    claims = JSON.parse(decoder.decode(base64UrlDecode(payloadPart)));
  } catch {
    throw new OidcError("Malformed id_token.", "invalid");
  }

  if (header.alg !== "RS256") throw new OidcError(`Unsupported id_token algorithm ${String(header.alg)}.`, "invalid");
  const jwk = options.keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) throw new OidcError("id_token signed with an unknown key.", "invalid");

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlDecode(signaturePart),
    encoder.encode(`${headerPart}.${payloadPart}`)
  );
  if (!verified) throw new OidcError("id_token signature did not verify.", "invalid");

  const now = Math.floor((options.now ?? Date.now()) / 1000);
  if (claims.iss !== (options.issuer ?? microsoftConsumerIssuer)) throw new OidcError("id_token issuer mismatch.", "invalid");
  if (claims.aud !== options.audience) throw new OidcError("id_token audience mismatch.", "invalid");
  if (typeof claims.exp !== "number" || claims.exp + clockSkewSeconds <= now) throw new OidcError("id_token expired.", "expired");
  if (typeof claims.nbf === "number" && claims.nbf - clockSkewSeconds > now) throw new OidcError("id_token not yet valid.", "invalid");
  if (!claims.nonce || !(await secureTokenEquals(claims.nonce, options.nonce))) throw new OidcError("id_token nonce mismatch.", "invalid");
  if (typeof claims.sub !== "string" || claims.sub.length === 0) throw new OidcError("id_token has no subject.", "invalid");

  return claims;
}

export async function fetchJwks(fetcher: typeof fetch = fetch): Promise<Jwk[]> {
  const response = await fetcher(microsoftJwksUri, { headers: { Accept: "application/json" } });
  const json = (await response.json().catch(() => null)) as { keys?: unknown } | null;
  if (!response.ok || !Array.isArray(json?.keys)) throw new OidcError("Could not fetch Microsoft signing keys.", "unavailable");
  return json.keys as Jwk[];
}

// ---------------------------------------------------------------------------
// Step 4: authorization. Anyone with a Microsoft account can reach the callback;
// only listed addresses get a session.

export function isAllowedEmail(claims: Pick<IdTokenClaims, "email" | "preferred_username">, allowedEmails: string): boolean {
  const allowed = new Set(
    allowedEmails
      .split(/[,\s]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0)
  );
  if (allowed.size === 0) return false;

  for (const candidate of [claims.email, claims.preferred_username]) {
    if (typeof candidate === "string" && allowed.has(candidate.trim().toLowerCase())) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------

async function createOidcStateCookie(payload: OidcStatePayload, signingSecret: string): Promise<string> {
  const encoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await hmacHex(encoded, signingSecret);
  // SameSite=Lax rather than Strict: the browser arrives at the callback from a
  // cross-site redirect, and Strict would withhold the cookie on that request.
  return `${oidcStateCookieName}=${encoded}.${signature}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${oidcStateMaxAgeSeconds}`;
}

// Compares SHA-256 digests so the loop runs a fixed 32 bytes regardless of input.
async function secureTokenEquals(actual: string, expected: string): Promise<boolean> {
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(actual)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const a = new Uint8Array(actualHash);
  const b = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${oidcStateCookieName}:v1:${message}`));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomBase64Url(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return base64UrlEncode(buffer);
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return undefined;
}
