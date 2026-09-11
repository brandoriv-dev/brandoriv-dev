import {
  base64UrlDecode,
  base64UrlEncode,
  beginMicrosoftLogin,
  clearOidcStateCookie,
  isAllowedEmail,
  microsoftAuthorizeEndpoint,
  microsoftConsumerIssuer,
  oidcStateCookieName,
  oidcStateMaxAgeSeconds,
  readOidcState,
  validateIdToken,
} from "./microsoft-auth.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const now = 1_800_000_000_000;
const clientId = "00000000-0000-4000-8000-000000000001";
const secret = "test-signing-secret-with-enough-entropy";
const redirectUri = "https://brandoriv.dev/mcp/auth/callback";
let checks = 0;

// --- login redirect and state cookie -------------------------------------

const login = await beginMicrosoftLogin({ clientId, redirectUri, signingSecret: secret, now });
const redirect = new URL(login.redirectUrl);
assert(login.redirectUrl.startsWith(microsoftAuthorizeEndpoint), "login redirects to the consumers authorize endpoint");
assert(redirect.searchParams.get("client_id") === clientId, "login carries the client id");
assert(redirect.searchParams.get("redirect_uri") === redirectUri, "login carries the callback URI");
assert(redirect.searchParams.get("response_type") === "code", "login requests an authorization code");
assert(redirect.searchParams.get("code_challenge_method") === "S256", "login uses PKCE S256");
assert(redirect.searchParams.get("scope")?.split(" ").includes("email"), "login requests the email scope");
assert(login.setCookie.startsWith(`${oidcStateCookieName}=`), "login sets the state cookie");
assert(login.setCookie.includes("HttpOnly") && login.setCookie.includes("Secure"), "state cookie is HttpOnly and Secure");
assert(login.setCookie.includes("SameSite=Lax"), "state cookie is Lax so it survives the cross-site return");
assert(login.setCookie.includes(`Max-Age=${oidcStateMaxAgeSeconds}`), "state cookie is short-lived");

const cookie = login.setCookie.split(";", 1)[0];
const stateFromCookie = await readOidcState(cookie, secret, now);
assert(stateFromCookie?.state === redirect.searchParams.get("state"), "state cookie round-trips the state");
assert(stateFromCookie?.nonce === redirect.searchParams.get("nonce"), "state cookie round-trips the nonce");

const expectedChallenge = base64UrlEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(stateFromCookie.verifier))));
assert(redirect.searchParams.get("code_challenge") === expectedChallenge, "PKCE challenge is SHA-256 of the stored verifier");

assert((await readOidcState(cookie, `${secret}x`, now)) === undefined, "state cookie signed with another secret is rejected");
assert((await readOidcState(`${cookie.slice(0, -1)}0`, secret, now)) === undefined, "tampered state cookie is rejected");
assert((await readOidcState(cookie, secret, now + (oidcStateMaxAgeSeconds + 1) * 1000)) === undefined, "expired state cookie is rejected");
assert((await readOidcState("other=value", secret, now)) === undefined, "missing state cookie is rejected");
assert(clearOidcStateCookie().includes("Max-Age=0"), "clearing the state cookie expires it");

// --- id_token validation ------------------------------------------------

const keyPair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"]
);
const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
const kid = "test-key-1";
const keys = [{ kid, kty: publicJwk.kty, n: publicJwk.n, e: publicJwk.e, use: "sig", alg: "RS256" }];
const nonce = stateFromCookie.nonce;
const nowSeconds = Math.floor(now / 1000);

const baseClaims = {
  iss: microsoftConsumerIssuer,
  aud: clientId,
  exp: nowSeconds + 3600,
  iat: nowSeconds,
  nbf: nowSeconds,
  nonce,
  sub: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  oid: "00000000-0000-0000-1234-56789abcdef0",
  tid: "9188040d-6c67-4c5b-b112-36a304b66dad",
  email: "brandoriv.dev@gmail.com",
  preferred_username: "brandoriv.dev@gmail.com",
  name: "Brandon Rivera",
};

const valid = await validateIdToken(await signJwt(baseClaims, keyPair.privateKey, kid), { audience: clientId, nonce, keys, now });
assert(valid.email === "brandoriv.dev@gmail.com", "a correctly signed id_token for this app validates");
assert(valid.oid === baseClaims.oid, "validated claims expose the oid for later pinning");

await expectReject(
  validateIdToken(await signJwt({ ...baseClaims, aud: "another-app" }, keyPair.privateKey, kid), { audience: clientId, nonce, keys, now }),
  "audience mismatch",
  "an id_token minted for another app is rejected"
);
await expectReject(
  validateIdToken(await signJwt({ ...baseClaims, nonce: "wrong" }, keyPair.privateKey, kid), { audience: clientId, nonce, keys, now }),
  "nonce mismatch",
  "an id_token with the wrong nonce is rejected (replay)"
);
await expectReject(
  validateIdToken(await signJwt({ ...baseClaims, exp: nowSeconds - 120 }, keyPair.privateKey, kid), { audience: clientId, nonce, keys, now }),
  "expired",
  "an expired id_token is rejected"
);
await expectReject(
  validateIdToken(await signJwt({ ...baseClaims, iss: "https://login.microsoftonline.com/attacker/v2.0" }, keyPair.privateKey, kid), { audience: clientId, nonce, keys, now }),
  "issuer mismatch",
  "an id_token from another issuer is rejected"
);
await expectReject(
  validateIdToken(await signJwt(baseClaims, keyPair.privateKey, "unknown-kid"), { audience: clientId, nonce, keys, now }),
  "unknown key",
  "an id_token signed with an unknown key id is rejected"
);

const otherKeyPair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"]
);
await expectReject(
  validateIdToken(await signJwt(baseClaims, otherKeyPair.privateKey, kid), { audience: clientId, nonce, keys, now }),
  "signature",
  "an id_token signed by a different key under the same kid is rejected"
);

const genuine = await signJwt(baseClaims, keyPair.privateKey, kid);
const [header, payload, signature] = genuine.split(".");
const forgedPayload = base64UrlEncode(encoder.encode(JSON.stringify({ ...baseClaims, email: "attacker@example.com" })));
await expectReject(
  validateIdToken(`${header}.${forgedPayload}.${signature}`, { audience: clientId, nonce, keys, now }),
  "signature",
  "an id_token whose claims were edited after signing is rejected"
);

const noneHeader = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "none", kid })));
await expectReject(
  validateIdToken(`${noneHeader}.${payload}.`, { audience: clientId, nonce, keys, now }),
  "algorithm",
  "alg=none is rejected"
);

assert(JSON.parse(decoder.decode(base64UrlDecode(payload))).email === baseClaims.email, "base64url helpers round-trip");

// --- allowlist ----------------------------------------------------------

assert(isAllowedEmail({ email: "brandoriv.dev@gmail.com" }, "brandoriv.dev@gmail.com"), "listed email is allowed");
assert(isAllowedEmail({ email: "BrandoRiv.Dev@Gmail.com" }, "brandoriv.dev@gmail.com"), "allowlist match is case-insensitive");
assert(isAllowedEmail({ preferred_username: "brandoriv.dev@gmail.com" }, "brandoriv.dev@gmail.com"), "preferred_username is accepted when email is absent");
assert(isAllowedEmail({ email: "b@example.com" }, "a@example.com, b@example.com"), "comma-separated allowlist works");
assert(!isAllowedEmail({ email: "attacker@example.com" }, "brandoriv.dev@gmail.com"), "unlisted email is refused");
assert(!isAllowedEmail({}, "brandoriv.dev@gmail.com"), "an id_token with no email claim is refused");
assert(!isAllowedEmail({ email: "brandoriv.dev@gmail.com" }, ""), "an empty allowlist refuses everyone");

console.log(`Microsoft auth tests passed (${checks} checks).`);

// --- helpers ------------------------------------------------------------

async function signJwt(claims, privateKey, keyId) {
  const head = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT", kid: keyId })));
  const body = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encoder.encode(`${head}.${body}`));
  return `${head}.${body}.${base64UrlEncode(new Uint8Array(sig))}`;
}

async function expectReject(promise, fragment, message) {
  try {
    await promise;
  } catch (error) {
    assert(String(error.message).toLowerCase().includes(fragment), `${message} (got: ${error.message})`);
    return;
  }
  assert(false, `${message} (no error thrown)`);
}

function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(`Microsoft auth test failed: ${message}`);
}
