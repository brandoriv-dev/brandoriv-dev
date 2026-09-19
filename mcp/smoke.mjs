import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const url = process.env.MCP_URL ?? "http://127.0.0.1:8791/mcp";
const token = process.env.MCP_BEARER_TOKEN;
const endpoint = new URL(url);
const loopbackHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);
const testedProtocols = ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"];
const expectedTools = ["list_preference_categories", "get_preferences", "get_guidance"];
const expectedIcon = "https://brandoriv.dev/mcp/brandoriv-mcp-icon.png";

if (!token) throw new Error("Set MCP_BEARER_TOKEN before running the MCP smoke test.");
if (endpoint.protocol !== "https:" && !loopbackHostnames.has(endpoint.hostname)) {
  throw new Error("Refusing to send MCP_BEARER_TOKEN over cleartext to a non-loopback host.");
}

const openClients = [];
try {
  const dashboard = await exerciseDashboard();
  const protocols = {};
  for (const protocol of testedProtocols) {
    const modern = protocol >= "2026-07-28";
    protocols[protocol] = await exerciseClient({
      name: `brandoriv-mcp-${protocol}-smoke`,
      versionNegotiation: modern ? { mode: { pin: protocol } } : { mode: "legacy" },
      supportedProtocolVersions: modern ? undefined : [protocol],
      expectedProtocol: protocol,
    });
  }

  const streamedBodyLimit = await exerciseOversizedDashboardLogin();
  console.log(JSON.stringify({ ok: true, url, dashboard, protocols, streamedBodyLimit }, null, 2));
} finally {
  await Promise.allSettled(openClients.map((client) => client.close()));
}

async function exerciseDashboard() {
  const healthResponse = await fetch(new URL("/mcp/health", endpoint));
  const health = await healthResponse.json();
  assert(healthResponse.ok && health.ok, "public health endpoint succeeds");
  assert(health.version === "1.9.0", "health endpoint reports dashboard release version");
  assertEqual(health.protocols, testedProtocols, "health protocol list");

  const documentResponse = await fetch(endpoint, { headers: { Accept: "text/html,application/xhtml+xml" } });
  const document = await documentResponse.text();
  assert(documentResponse.ok, "browser document request succeeds");
  assert(document.includes("Private MCP console"), "browser document returns the dashboard shell");
  assert(!document.includes('name="token"'), "dashboard form cannot serialize the bearer token natively");
  assert(documentResponse.headers.get("cache-control") === "no-store", "dashboard shell is not cached");
  assert(
    documentResponse.headers.get("content-security-policy")?.includes("form-action 'none'"),
    "dashboard shell has a restrictive content security policy"
  );

  assert(document.includes("Sign in with Microsoft"), "dashboard shell offers Microsoft sign-in");
  assert(document.includes('href="/mcp/auth/login"'), "Microsoft sign-in links to the login route");

  // Microsoft sign-in: the redirect out, and the two ways the callback refuses.
  const microsoftLoginResponse = await fetch(new URL("/mcp/auth/login", endpoint), { redirect: "manual" });
  const microsoftLoginLocation = new URL(microsoftLoginResponse.headers.get("location") ?? "", endpoint);
  const oidcCookie = microsoftLoginResponse.headers.get("set-cookie") ?? "";
  assert(microsoftLoginResponse.status === 302, "login route redirects");
  assert(microsoftLoginLocation.href.startsWith("https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize"), "login redirects to Microsoft's consumers authorize endpoint");
  assert(microsoftLoginLocation.searchParams.get("code_challenge_method") === "S256", "login uses PKCE");
  assert(microsoftLoginLocation.searchParams.get("redirect_uri") === "https://brandoriv.dev/mcp/auth/callback", "login names the registered callback exactly");
  assert(oidcCookie.startsWith("__Host-brandoriv_mcp_oidc=") && oidcCookie.includes("HttpOnly"), "login sets a hardened state cookie");
  assert(microsoftLoginResponse.headers.get("cache-control") === "no-store", "login redirect is not cached");

  const callbackNoState = await fetch(new URL("/mcp/auth/callback?code=x&state=y", endpoint), { redirect: "manual" });
  assert(callbackNoState.status === 302 && callbackNoState.headers.get("location") === "/mcp?login=expired", "callback without a state cookie is refused as expired");

  const callbackBadState = await fetch(new URL("/mcp/auth/callback?code=x&state=not-the-state", endpoint), {
    redirect: "manual",
    headers: { Cookie: oidcCookie.split(";", 1)[0] },
  });
  assert(callbackBadState.status === 302 && callbackBadState.headers.get("location") === "/mcp?login=denied", "callback with a mismatched state is refused");
  assert(callbackBadState.headers.get("set-cookie")?.includes("Max-Age=0"), "refused callback clears the state cookie");

  const callbackUserCancelled = await fetch(new URL("/mcp/auth/callback?error=access_denied", endpoint), {
    redirect: "manual",
    headers: { Cookie: oidcCookie.split(";", 1)[0] },
  });
  assert(callbackUserCancelled.headers.get("location") === "/mcp?login=denied", "callback carrying Microsoft's error is refused");

  const alternateDocumentResponse = await fetch(new URL("/mcp/index.html", endpoint), {
    headers: { Accept: "application/json" },
  });
  assert(alternateDocumentResponse.ok, "alternate dashboard document path succeeds");
  assert(
    alternateDocumentResponse.headers.get("content-security-policy")?.includes("form-action 'none'"),
    "alternate dashboard document path keeps the security headers"
  );

  const mixedAcceptResponse = await fetch(endpoint, { headers: { Accept: "text/html,text/event-stream" } });
  assert(mixedAcceptResponse.status === 401, "SSE-capable GET is never replaced by the dashboard document");

  const rejectedHtmlResponse = await fetch(endpoint, { headers: { Accept: "text/html; q = 0,application/json" } });
  assert(rejectedHtmlResponse.status === 401, "an explicitly rejected HTML range does not select the dashboard");

  const fetchApiResponse = await fetch(endpoint, {
    headers: { Accept: "text/html", "Sec-Fetch-Dest": "empty" },
  });
  assert(fetchApiResponse.status === 401, "a non-document Fetch request does not select the dashboard");

  const rejectedOriginResponse = await fetch(endpoint, {
    method: "OPTIONS",
    headers: {
      Origin: "https://attacker.example",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  assert(rejectedOriginResponse.status === 403, "MCP rejects an untrusted browser Origin");

  const allowedOriginResponse = await fetch(endpoint, {
    method: "OPTIONS",
    headers: {
      Origin: endpoint.origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  assert(allowedOriginResponse.ok, "MCP accepts the endpoint's own browser Origin");

  const unauthorizedData = await fetch(new URL("/mcp/dashboard/data", endpoint), {
    headers: { Accept: "application/json" },
  });
  assert(unauthorizedData.status === 401, "dashboard data rejects a missing session");
  assert(unauthorizedData.headers.get("cache-control") === "no-store", "dashboard auth failures are not cached");

  const rejectedLogin = await fetch(new URL("/mcp/dashboard/session", endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: `${token}-invalid` }),
  });
  assert(rejectedLogin.status === 401, "dashboard login rejects an invalid bearer token");

  const loginResponse = await fetch(new URL("/mcp/dashboard/session", endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const setCookie = loginResponse.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";", 1)[0];
  assert(loginResponse.status === 204, "dashboard login accepts the MCP bearer token");
  assert(setCookie.includes("HttpOnly") && setCookie.includes("Secure") && setCookie.includes("SameSite=Strict"), "dashboard login sets a hardened session cookie");
  assert(!setCookie.includes(token), "dashboard session cookie does not contain the bearer token");

  const dataResponse = await fetch(new URL("/mcp/dashboard/data", endpoint), {
    headers: { Accept: "application/json", Cookie: cookie },
  });
  const data = await dataResponse.json();
  assert(dataResponse.ok && data.ok, "signed dashboard session can read dashboard data");
  assert(data.service.version === "1.9.0", "dashboard data reports current service version");
  assert(data.evaluation.serializedResultTokens.changePercent === -53.7, "dashboard data reports the measured token delta");
  assert(data.evaluation.guidanceText.changePercent === -51.8, "dashboard data reports the guidance-text delta");
  assert(
    data.evaluation.serializedResultTokens.tokenizer === "gpt-tokenizer o200k_base",
    "dashboard data identifies the tokenizer"
  );
  assert(data.evaluation.provenance.modelAnswerSample.reproducible === false, "dashboard data marks recorded quality as directional");
  assert(data.categories.length === 25, "dashboard data includes every policy-tree entry and command");
  assert(data.policyStorage.durable === true, "dashboard data confirms durable policy storage");
  assertEqual(data.tools.map(({ name }) => name).sort(), [...expectedTools].sort(), "dashboard tool catalog");
  // Deliberate: the token is served to an authenticated session so a new device can
  // be set up from the Connect view. It must never appear in the public shell.
  assert(data.service.bearerToken === token, "authenticated dashboard data carries the bearer token for device setup");
  assert(!document.includes(token), "public dashboard shell never contains the bearer token");
  const stylesheet = await (await fetch(new URL("/mcp/dashboard.css", endpoint))).text();
  assert(/body\[data-authenticated="false"\]\s*\.console-shell\s*\{[^}]*display:\s*none/.test(stylesheet), "console is hidden, not dimmed, until a session exists");

  const logoutResponse = await fetch(new URL("/mcp/dashboard/session", endpoint), {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert(logoutResponse.status === 204, "dashboard logout succeeds");
  assert(logoutResponse.headers.get("set-cookie")?.includes("Max-Age=0"), "dashboard logout clears the cookie");

  return {
    document: documentResponse.status,
    authentication: "signed HttpOnly session",
    categories: data.categories.length,
    evaluation: `${data.evaluation.serializedResultTokens.changePercent}% serialized result tokens`,
  };
}

async function exerciseOversizedDashboardLogin() {
  const oversizedBody = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('{"token":"'));
      controller.enqueue(encoder.encode("x".repeat(9000)));
      controller.enqueue(encoder.encode('"}'));
      controller.close();
    },
  });
  const oversizedLogin = await fetch(new URL("/mcp/dashboard/session", endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: oversizedBody,
    duplex: "half",
  });
  assert(oversizedLogin.status === 413, "dashboard rejects an oversized streamed login body");
  return "413 before buffering past 8192 bytes";
}

async function exerciseClient({ name, versionNegotiation, supportedProtocolVersions, expectedProtocol }) {
  const client = new Client(
    { name, version: "1.0.0" },
    { versionNegotiation, supportedProtocolVersions }
  );
  const transport = new StreamableHTTPClientTransport(endpoint, {
    authProvider: { token: async () => token },
  });

  await client.connect(transport);
  openClients.push(client);

  const instructions = client.getInstructions() ?? "";
  assert(client.getServerVersion()?.icons?.some(({ src }) => src === expectedIcon), `${name}: server advertises the MCP icon`);
  assert(instructions.slice(0, 512).includes("get_guidance"), `${name}: initialization instructions name get_guidance`);
  // The always-on baseline rides in instructions so every client on every device
  // receives it at connect time, with no tool call and no per-machine setup.
  assert(instructions.includes("Communication Preferences"), `${name}: instructions carry the always-on communication baseline`);
  assert(!instructions.includes("Unslop Writing Preferences"), `${name}: instructions do not preload routed writing guidance`);
  assert(!instructions.includes("Code Style Check"), `${name}: instructions do not preload routed code-style guidance`);

  const { tools } = await client.listTools();
  const toolNames = tools.map(({ name }) => name);
  assertEqual(toolNames, expectedTools, `${name} tool list`);
  assert(tools.every(({ icons }) => icons?.some(({ src }) => src === expectedIcon)), `${name}: every tool advertises the MCP icon`);
  const { prompts } = await client.listPrompts();
  assert(prompts.some(({ name: promptName }) => promptName === "grill-me"), `${name}: commands expose the grill-me prompt`);
  assert(
    tools.every(
      ({ annotations }) =>
        annotations?.readOnlyHint === true &&
        annotations.destructiveHint === false &&
        annotations.idempotentHint === true &&
        annotations.openWorldHint === false
    ),
    `${name}: every tool is annotated as read-only, non-destructive, idempotent, and closed-world`
  );

  const guidance = await client.callTool({
    name: "get_guidance",
    arguments: { task: "Debug this SQL exception", language: "C#", framework: ".NET" },
  });
  const guidanceText = guidance.content.find((item) => item.type === "text")?.text ?? "";
  assert(!guidance.isError, `${name}: get_guidance succeeds`);
  assert(guidanceText.includes("TL;DR:"), `${name}: guidance includes the TL;DR rule`);
  assert(guidanceText.includes("Spend tokens aggressively"), `${name}: guidance spends tokens on useful work`);
  assert(guidanceText.includes("through compaction"), `${name}: guidance persists through compaction`);
  assert(guidanceText.includes("official owner docs"), `${name}: guidance includes the official-documentation rule`);
  // Clients that surface structuredContent ignore the content block entirely. If the
  // guidance is missing there, the call still reports success while delivering an
  // empty policy, so assert the client-visible path directly.
  assert(
    guidance.structuredContent?.guidance === guidanceText,
    `${name}: get_guidance repeats the guidance in structuredContent`
  );

  const grilling = await client.callTool({
    name: "get_guidance",
    arguments: { task: "/grill-me on the purpose of the Harness" },
  });
  const grillingText = grilling.content.find((item) => item.type === "text")?.text ?? "";
  assert(!grilling.isError, `${name}: grill-me guidance succeeds`);
  assert(grilling.structuredContent?.categories?.includes("grill-me"), `${name}: grill-me routes explicitly`);
  assert(grillingText.includes("Map decisions as a tree"), `${name}: grill-me delivers the decision-tree method`);
  assert(grillingText.includes("Wait for the user's answers after each round"), `${name}: grill-me pauses for decisions`);
  assert(grilling.structuredContent?.guidance === grillingText, `${name}: grill-me reaches structured clients`);

  const communication = await client.callTool({
    name: "get_preferences",
    arguments: { category: "communication" },
  });
  assert(!communication.isError, `${name}: get_preferences retrieves one category`);
  assertEqual(communication.structuredContent?.categories, ["communication"], `${name} single preference category`);
  assert(
    (communication.structuredContent?.guidance?.length ?? 0) > 0,
    `${name}: get_preferences repeats the guidance in structuredContent`
  );

  const fullPolicy = await client.callTool({ name: "get_preferences", arguments: { category: "all" } });
  assert(!fullPolicy.isError, `${name}: get_preferences retrieves an explicitly requested policy audit`);
  assert(fullPolicy.structuredContent?.categories?.length === 15, `${name}: full policy contains every category`);

  const missingScope = await client.callTool({ name: "get_preferences", arguments: {} });
  assert(missingScope.isError === true, `${name}: get_preferences rejects an implicit full-policy dump`);

  const protocol = client.getNegotiatedProtocolVersion();
  if (expectedProtocol) assert(protocol === expectedProtocol, `${name}: protocol version is pinned`);

  return {
    server: client.getServerVersion(),
    protocol,
    tools: toolNames,
    guidanceCategories: guidance.structuredContent?.categories,
  };
}

function assertEqual(actual, expected, label) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(`MCP smoke test failed: ${message}`);
}
