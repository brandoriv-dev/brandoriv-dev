const encoder = new TextEncoder();

export const dashboardSessionCookieName = "__Host-brandoriv_mcp_dashboard";
export const dashboardSessionMaxAgeSeconds = 8 * 60 * 60;

export function bearerTokenFrom(request: Request): string | undefined {
  const authorization = request.headers.get("Authorization") ?? "";
  return authorization.match(/^Bearer\s+(\S+)\s*$/i)?.[1];
}

export async function secureTokenEquals(actual: string, expected: string): Promise<boolean> {
  const [actualHash, expectedHash] = await Promise.all([sha256(actual), sha256(expected)]);
  let difference = 0;

  for (let index = 0; index < actualHash.length; index += 1) {
    difference |= actualHash[index] ^ expectedHash[index];
  }

  return difference === 0;
}

export async function createDashboardSessionCookie(expectedToken: string, now = Date.now()): Promise<string> {
  const expiresAt = Math.floor(now / 1000) + dashboardSessionMaxAgeSeconds;
  const signature = await signSession(expiresAt, expectedToken);
  return `${dashboardSessionCookieName}=${expiresAt}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${dashboardSessionMaxAgeSeconds}`;
}

export function clearDashboardSessionCookie(): string {
  return `${dashboardSessionCookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function hasValidDashboardSession(
  request: Request,
  expectedToken: string,
  now = Date.now()
): Promise<boolean> {
  const value = readCookie(request.headers.get("Cookie"), dashboardSessionCookieName);
  const match = value?.match(/^(\d{10})\.([a-f0-9]{64})$/);
  if (!match) return false;

  const expiresAt = Number(match[1]);
  const nowSeconds = Math.floor(now / 1000);
  if (expiresAt <= nowSeconds || expiresAt > nowSeconds + dashboardSessionMaxAgeSeconds + 60) return false;

  const expectedSignature = await signSession(expiresAt, expectedToken);
  return secureTokenEquals(match[2], expectedSignature);
}

async function signSession(expiresAt: number, expectedToken: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(expectedToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${dashboardSessionCookieName}:v1:${expiresAt}`)
  );
  return bytesToHex(new Uint8Array(signature));
}

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return new Uint8Array(digest);
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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
