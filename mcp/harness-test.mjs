import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire, stripTypeScriptTypes } from "node:module";
import { isHarnessPath, proxyHarnessRequest } from "./harness.ts";

const origin = "https://func-harness-test.azurewebsites.net";
let checks = 0;
async function check(name, run) {
  try { await run(); checks += 1; }
  catch (error) { throw new Error(`Harness proxy test failed: ${name}`, { cause: error }); }
}

await check("routes only the harness namespace", async () => {
  assert.equal(isHarnessPath("/harness"), true);
  assert.equal(isHarnessPath("/harness/.auth/login/aad/callback"), true);
  for (const path of ["/", "/mcp", "/harness-other", "/harness%2fapi", "/harnesses"]) {
    assert.equal(isHarnessPath(path), false);
  }
  const response = await proxyHarnessRequest(new Request("https://brandoriv.dev/mcp"), origin, () => assert.fail("must not fetch"));
  assert.equal(response.status, 404);
});

await check("rejects missing and unsafe configured origins", async () => {
  for (const value of [undefined, "", "not a URL", "http://func-harness-test.azurewebsites.net", "https://evil.example", "https://func-harness-test.azurewebsites.net.evil.example", "https://user:password@func-harness-test.azurewebsites.net", "https://func-harness-test.azurewebsites.net:444", `${origin}/harness`, `${origin}?target=evil`]) {
    const response = await proxyHarnessRequest(new Request("https://brandoriv.dev/harness"), value, () => assert.fail("must not fetch"));
    assert.equal(response.status, 503, String(value));
  }
});

await check("canonicalizes host and HTTPS without forwarding credentials", async () => {
  const response = await proxyHarnessRequest(new Request("http://www.brandoriv.dev/harness?view=agents", { headers: { Authorization: "Bearer private" } }), origin, () => assert.fail("must not fetch"));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("Location"), "https://brandoriv.dev/harness?view=agents");
});

await check("preserves full paths, query, method, body, and owner authorization", async () => {
  const body = JSON.stringify({ agentId: "project-manager", status: "healthy" });
  const request = new Request("https://brandoriv.dev/harness/api/heartbeats?source=desktop", {
    method: "POST",
    headers: { Authorization: "Bearer owner-token", "Content-Type": "application/json", Origin: "https://brandoriv.dev", "X-Harness-Csrf": "yes" },
    body,
  });
  const response = await proxyHarnessRequest(request, origin, async (upstream, options) => {
    assert.equal(upstream.url, `${origin}/harness/api/heartbeats?source=desktop`);
    assert.equal(upstream.method, "POST");
    assert.equal(await upstream.text(), body);
    assert.equal(upstream.headers.get("Authorization"), "Bearer owner-token");
    assert.equal(upstream.headers.get("Origin"), "https://brandoriv.dev");
    assert.equal(upstream.headers.get("X-Harness-Csrf"), "yes");
    assert.equal(upstream.headers.get("Host"), "func-harness-test.azurewebsites.net");
    assert.equal(upstream.redirect, "manual");
    assert.equal(options.redirect, "manual");
    assert.equal(options.cache, "no-store");
    assert.equal(options.cf, undefined);
    return new Response('{"ok":true}', { status: 201, headers: { "Content-Type": "application/json" } });
  });
  assert.equal(response.status, 201);
  assert.equal(await response.text(), '{"ok":true}');
});

await check("strips spoofed identity and forwarding headers", async () => {
  const forbidden = {
    "X-MS-CLIENT-PRINCIPAL": "forged", "X-MS-CLIENT-PRINCIPAL-ID": "owner-id",
    "X-MS-TOKEN-AAD-ACCESS-TOKEN": "forged-token", "X-ARR-SSL": "forged-ssl",
    "X-Forwarded-Host": "evil.example", "X-Forwarded-Proto": "http", "Forwarded": "host=evil.example",
    "X-Original-URL": "https://evil.example", "CF-Access-Jwt-Assertion": "forged", "X-Zumo-Auth": "forged",
    "Proxy-Authorization": "Basic private", "X-Internal-Only": "hop-secret",
  };
  const request = new Request("https://brandoriv.dev/harness", { headers: {
    ...forbidden, Connection: "X-Internal-Only", "X-Harness-Forwarded-Host": "evil.example", "X-Harness-Forwarded-Proto": "http",
  } });
  await proxyHarnessRequest(request, origin, async (upstream) => {
    for (const name of Object.keys(forbidden)) assert.equal(upstream.headers.has(name), false, name);
    assert.equal(upstream.headers.get("X-Harness-Forwarded-Host"), "brandoriv.dev");
    assert.equal(upstream.headers.get("X-Harness-Forwarded-Proto"), "https");
    return new Response("ok");
  });
});

await check("never forwards MCP or unrelated website session cookies to Azure", async () => {
  const request = new Request("https://brandoriv.dev/harness", { headers: { Cookie: "__Host-brandoriv_mcp_dashboard=private-mcp-session; analytics=private-analytics; AppServiceAuthSession=azure-session; AppServiceAuthSession_1=chunk; AppServiceAuthNonce=nonce; ARRAffinitySameSite=affinity" } });
  await proxyHarnessRequest(request, origin, async (upstream) => {
    assert.equal(upstream.headers.get("Cookie"), "AppServiceAuthSession=azure-session; AppServiceAuthSession_1=chunk; AppServiceAuthNonce=nonce; ARRAffinitySameSite=affinity");
    return new Response("ok");
  });
  await proxyHarnessRequest(new Request("https://brandoriv.dev/harness", { headers: { Cookie: "__Host-brandoriv_mcp_dashboard=private" } }), origin, async (upstream) => {
    assert.equal(upstream.headers.has("Cookie"), false);
    return new Response("ok");
  });
});

await check("does not change OAuth form_post callback path or body", async () => {
  const payload = "code=private-code&state=signed%2Bstate";
  const request = new Request("https://brandoriv.dev/harness/.auth/login/aad/callback", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://login.microsoftonline.com" }, body: payload,
  });
  await proxyHarnessRequest(request, origin, async (upstream) => {
    assert.equal(upstream.url, `${origin}/harness/.auth/login/aad/callback`);
    assert.equal(upstream.headers.get("Origin"), "https://login.microsoftonline.com");
    assert.equal(await upstream.text(), payload);
    return new Response(null, { status: 302, headers: { Location: "/harness" } });
  });
});

await check("rewrites only local redirects and keeps a single harness prefix", async () => {
  const cases = [
    [`${origin}/harness/.auth/login/aad?post_login_redirect_uri=%2Fharness`, "https://brandoriv.dev/harness/.auth/login/aad?post_login_redirect_uri=%2Fharness"],
    [`${origin}/`, "https://brandoriv.dev/harness/"],
    ["/.auth/logout", "https://brandoriv.dev/harness/.auth/logout"],
    ["/harness", "https://brandoriv.dev/harness"],
    ["next?x=1#agents", "https://brandoriv.dev/harness/next?x=1#agents"],
    ["https://brandoriv.dev/harness/?tab=cost", "https://brandoriv.dev/harness/?tab=cost"],
    ["https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fbrandoriv.dev%2Fharness%2F.auth%2Flogin%2Faad%2Fcallback&state=opaque%2Bsigned", "https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fbrandoriv.dev%2Fharness%2F.auth%2Flogin%2Faad%2Fcallback&state=opaque%2Bsigned"],
    ["https://func-harness-test.azurewebsites.net.evil.example/private", "https://func-harness-test.azurewebsites.net.evil.example/private"],
  ];
  for (const [location, expected] of cases) {
    const response = await proxyHarnessRequest(new Request("https://brandoriv.dev/harness/"), origin, async () => new Response(null, { status: 302, headers: { Location: location } }));
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("Location"), expected);
  }
});

await check("preserves distinct Set-Cookie headers and expiry while scoping cookies", async () => {
  const headers = new Headers();
  headers.append("Set-Cookie", "AppServiceAuthSession=session; Path=/; Domain=.func-harness-test.azurewebsites.net; HttpOnly; Secure; SameSite=None");
  headers.append("Set-Cookie", "AppServiceAuthNonce=; Path=/harness/.auth; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly");
  headers.append("Set-Cookie", "unrelated=value; Domain=other.example; Path=/");
  const response = await proxyHarnessRequest(new Request("https://brandoriv.dev/harness/"), origin, async () => new Response(null, { status: 302, headers }));
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 3);
  assert.match(cookies[0], /HttpOnly; Secure; SameSite=None; Path=\/harness/);
  assert.doesNotMatch(cookies[0], /Domain=/i);
  assert.match(cookies[1], /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  assert.match(cookies[1], /Max-Age=0/);
  assert.match(cookies[1], /Path=\/harness; Secure$/);
  assert.match(cookies[2], /Domain=other\.example/);
  for (const cookie of cookies) assert.equal((cookie.match(/Path=/gi) ?? []).length, 1);
});

await check("prevents browser and shared caching of authenticated responses", async () => {
  const response = await proxyHarnessRequest(new Request("https://brandoriv.dev/harness/api/state"), origin, async () => new Response("private", { headers: {
    "Cache-Control": "public, max-age=86400", "CDN-Cache-Control": "max-age=86400", "Surrogate-Control": "max-age=86400", Expires: "Thu, 01 Jan 2037 00:00:00 GMT",
  } }));
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("CDN-Cache-Control"), "no-store");
  assert.equal(response.headers.get("Cloudflare-CDN-Cache-Control"), "no-store");
  assert.equal(response.headers.has("Surrogate-Control"), false);
  assert.equal(response.headers.has("Expires"), false);
});

await check("keeps upstream errors opaque and HEAD responses bodyless", async () => {
  const error = await proxyHarnessRequest(new Request("https://brandoriv.dev/harness"), origin, async () => { throw new Error(`${origin}: Bearer secret`); });
  assert.equal(error.status, 502);
  assert.equal(await error.text(), "Harness is temporarily unavailable.");
  const head = await proxyHarnessRequest(new Request("https://brandoriv.dev/harness", { method: "HEAD" }), origin, async (upstream) => {
    assert.equal(upstream.method, "HEAD");
    return new Response("must not be sent", { headers: { "Content-Type": "text/html" } });
  });
  assert.equal(await head.text(), "");
});

await check("workerd forwards uncached requests without conflicting cache options", async () => {
  // Use the runtime version installed with Wrangler, including nested installs.
  // Node's fetch mocks do not validate Cloudflare-specific cache option conflicts.
  const require = createRequire(import.meta.url);
  const wranglerRequire = createRequire(require.resolve("wrangler/package.json"));
  const { Miniflare } = wranglerRequire("miniflare");
  const source = stripTypeScriptTypes(await readFile(new URL("./harness.ts", import.meta.url), "utf8"));
  const script = `import { proxyHarnessRequest } from './harness.js';\nexport default { fetch(request) { return proxyHarnessRequest(request, ${JSON.stringify(origin)}); } };`;
  let upstreamCalls = 0;
  const runtime = new Miniflare({
    telemetry: { enabled: false },
    workers: [{
      config: {
        name: "harness-proxy-test",
        type: "worker",
        compatibilityDate: "2026-08-26",
        compatibilityFlags: ["nodejs_compat"],
        manifest: { mainModule: "worker.js", modules: {
          "worker.js": { type: "esm", contents: script },
          "harness.js": { type: "esm", contents: source },
        } },
      },
      dev: {
        outboundService: {
          type: "fetcher",
          handler: async (request) => {
            upstreamCalls += 1;
            assert.equal(request.url, `${origin}/harness/api/state`);
            assert.equal(request.headers.get("X-Harness-Forwarded-Host"), "brandoriv.dev");
            assert.equal(request.headers.get("X-Harness-Forwarded-Proto"), "https");
            assert.equal(request.headers.has("Authorization"), false);
            return new Response("Owner authentication required.", { status: 401 });
          },
        },
      },
    }],
  });
  try {
    const response = await runtime.dispatchFetch("https://brandoriv.dev/harness/api/state");
    assert.equal(response.status, 401, "workerd must relay the upstream authentication response, not synthesize a 502");
    assert.equal(await response.text(), "Owner authentication required.");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.equal(upstreamCalls, 1);
  } finally {
    await runtime.dispose();
  }
});

console.log(`Harness proxy tests passed (${checks} cases).`);
