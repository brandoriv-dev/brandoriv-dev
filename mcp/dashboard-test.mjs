import {
  bearerTokenFrom,
  clearDashboardSessionCookie,
  createDashboardSessionCookie,
  dashboardSessionCookieName,
  dashboardSessionMaxAgeSeconds,
  hasValidDashboardSession,
  secureTokenEquals,
} from "./dashboard-auth.ts";
import { readFile } from "node:fs/promises";
import { evaluationSnapshot } from "./evaluation.ts";
import { serviceEndpoint, serviceIconUrl, serviceIcons, serviceVersion, supportedProtocols, toolCatalog } from "./service.ts";

const now = 1_800_000_000_000;
const token = "test-token-with-enough-entropy-for-session-signing";
const setCookie = await createDashboardSessionCookie(token, now);
const cookie = setCookie.split(";", 1)[0];

assert(setCookie.startsWith(`${dashboardSessionCookieName}=`), "session cookie has the expected name");
assert(setCookie.includes("HttpOnly"), "session cookie is HttpOnly");
assert(setCookie.includes("Secure"), "session cookie is Secure");
assert(setCookie.includes("SameSite=Strict"), "session cookie uses strict same-site protection");
assert(setCookie.includes("Path=/"), "session cookie uses the __Host-compatible root path");
assert(setCookie.includes(`Max-Age=${dashboardSessionMaxAgeSeconds}`), "session cookie has an eight-hour lifetime");
assert(!setCookie.includes(token), "session cookie never contains the bearer token");

assert(await hasValidDashboardSession(requestWithCookie(cookie), token, now), "fresh signed session is accepted");
assert(
  !(await hasValidDashboardSession(requestWithCookie(cookie), token, now + dashboardSessionMaxAgeSeconds * 1000 + 1)),
  "expired session is rejected"
);
assert(!(await hasValidDashboardSession(requestWithCookie(cookie), `${token}-wrong`, now)), "wrong signing secret is rejected");

const tamperedCookie = `${cookie.slice(0, -1)}${cookie.endsWith("0") ? "1" : "0"}`;
assert(!(await hasValidDashboardSession(requestWithCookie(tamperedCookie), token, now)), "tampered signature is rejected");
assert(!(await hasValidDashboardSession(requestWithCookie("unrelated=value"), token, now)), "missing session is rejected");

const futureCookie = (await createDashboardSessionCookie(token, now + 120_000)).split(";", 1)[0];
assert(!(await hasValidDashboardSession(requestWithCookie(futureCookie), token, now)), "implausibly future session is rejected");

assert(await secureTokenEquals(token, token), "equal tokens match");
assert(!(await secureTokenEquals(token, `${token}x`)), "different tokens do not match");
assert(
  bearerTokenFrom(new Request("https://brandoriv.dev/mcp", { headers: { Authorization: `bEaReR ${token}` } })) === token,
  "bearer parsing is case-insensitive"
);
assert(bearerTokenFrom(new Request("https://brandoriv.dev/mcp")) === undefined, "missing bearer header stays missing");

const clearedCookie = clearDashboardSessionCookie();
assert(clearedCookie.includes("Max-Age=0"), "logout clears the session cookie");
assert(clearedCookie.includes("Expires=Thu, 01 Jan 1970"), "logout expires the session cookie");

assert(serviceEndpoint === "https://brandoriv.dev/mcp", "dashboard uses the canonical endpoint");
assert(serviceVersion === "1.11.0", "dashboard release version is current");
assert(serviceIconUrl === "https://brandoriv.dev/mcp/brandoriv-mcp-icon.png", "MCP icon uses the canonical public URL");
assert(serviceIcons[0]?.sizes?.includes("1254x1254"), "MCP icon declares its source dimensions");
assert(supportedProtocols.length === 4, "dashboard lists every supported protocol");
assert(toolCatalog.length === 3, "dashboard lists every MCP tool");
assert(evaluationSnapshot.corpus.policyCases === 26, "dashboard records all policy evaluation cases");
assert(evaluationSnapshot.serializedResultTokens.tokenizer === "gpt-tokenizer o200k_base", "dashboard identifies the tokenizer");
assert(evaluationSnapshot.guidanceText.changePercent === -47.4, "dashboard reports the guidance-text delta");
assert(evaluationSnapshot.normalizedSerializedResponses.changePercent === -46.4, "dashboard reports the normalized delta");
assert(evaluationSnapshot.policyPatternChecks.candidate === 383, "dashboard labels deterministic pattern checks");
assert(
  evaluationSnapshot.serializedResponses.candidateBytes < evaluationSnapshot.serializedResponses.baselineBytes,
  "snapshot records the progressive-disclosure reduction"
);
assert(!evaluationSnapshot.provenance.modelAnswerSample.reproducible, "dashboard marks the recorded model sample non-reproducible");

const dashboardScript = await readFile(new URL("../public/mcp/dashboard.js", import.meta.url), "utf8");
const dashboardStyles = await readFile(new URL("../public/mcp/dashboard.css", import.meta.url), "utf8");
const dashboardPage = await readFile(new URL("../src/pages/mcp/index.astro", import.meta.url), "utf8");
const siteLayout = await readFile(new URL("../src/layouts/Layout.astro", import.meta.url), "utf8");
const siteManifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const mcpManifest = JSON.parse(await readFile(new URL("../public/mcp/manifest.webmanifest", import.meta.url), "utf8"));
assert(dashboardScript.includes('disclosure.className = "category-disclosure"'), "policy groups have a separate disclosure control");
assert(dashboardScript.includes('disclosure.setAttribute("aria-expanded"'), "policy disclosure state is exposed accessibly");
assert(dashboardStyles.includes("--font-mono:") && dashboardStyles.includes("font-family: var(--font-mono)"), "technical text has a dedicated monospace role");
assert(dashboardStyles.includes("-webkit-line-clamp: 2"), "major-group descriptions remain readable in the tree");
assert(dashboardPage.includes('aria-controls="topbar-more-panel"'), "mobile utility actions use a labelled overflow control");
assert(dashboardStyles.includes("--coral: #ff8156") && dashboardStyles.includes("--amber: #f5b83a"), "dark dashboard accents use the mascot palette");
assert(siteLayout.includes('/favicon-32.png') && siteLayout.includes('/apple-touch-icon.png'), "site layout publishes flat mascot browser icons");
assert(siteManifest.icons.length === 2, "site manifest publishes 192 and 512 pixel mascot icons");
assert(mcpManifest.icons.length === 3, "MCP manifest retains the source mascot and app-size variants");

console.log("MCP dashboard tests passed (39 checks).");

function requestWithCookie(value) {
  return new Request("https://brandoriv.dev/mcp/dashboard/data", { headers: { Cookie: value } });
}

function assert(condition, message) {
  if (!condition) throw new Error(`MCP dashboard test failed: ${message}`);
}
