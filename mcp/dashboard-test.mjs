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
import { MOSS_ICON_NAMES } from "../public/mcp/moss/v0.1.0-cb75ab0/icons.js";
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
assert(serviceVersion === "1.14.0", "dashboard release version is current");
assert(serviceIconUrl === "https://brandoriv.dev/mcp/brandoriv-mcp-icon.png", "MCP icon uses the canonical public URL");
assert(serviceIcons[0]?.sizes?.includes("1254x1254"), "MCP icon declares its source dimensions");
assert(supportedProtocols.length === 4, "dashboard lists every supported protocol");
assert(toolCatalog.length === 3, "dashboard lists every MCP tool");
assert(evaluationSnapshot.corpus.policyCases === 26, "dashboard records all policy evaluation cases");
assert(evaluationSnapshot.serializedResultTokens.tokenizer === "gpt-tokenizer o200k_base", "dashboard identifies the tokenizer");
assert(evaluationSnapshot.guidanceText.changePercent === -54.2, "dashboard reports the guidance-text delta");
assert(evaluationSnapshot.normalizedSerializedResponses.changePercent === -53.3, "dashboard reports the normalized delta");
assert(evaluationSnapshot.policyPatternChecks.candidate === 228, "dashboard labels diagnostic phrase checks");
assert(
  evaluationSnapshot.serializedResponses.candidateBytes < evaluationSnapshot.serializedResponses.baselineBytes,
  "snapshot records the progressive-disclosure reduction"
);
assert(!evaluationSnapshot.provenance.modelAnswerSample.reproducible, "dashboard marks the recorded model sample non-reproducible");
assert(evaluationSnapshot.corpus.answerPairs === 8, "dashboard records the answer-study sample size");
assert(evaluationSnapshot.blindJudge.possible === 8 && evaluationSnapshot.strictJudge.possible === 8, "dashboard records judge sample sizes");
assert(evaluationSnapshot.payloadTrend.length === 4 && evaluationSnapshot.payloadTrend.at(-1)?.tokens === 23_049, "dashboard retains measured payload checkpoints");

const dashboardScript = await readFile(new URL("../public/mcp/dashboard.js", import.meta.url), "utf8");
const dashboardStyles = await readFile(new URL("../public/mcp/dashboard.css", import.meta.url), "utf8");
const dashboardPage = await readFile(new URL("../src/pages/mcp/index.astro", import.meta.url), "utf8");
const mossTheme = await readFile(new URL("../public/mcp/moss-theme.js", import.meta.url), "utf8");
const mossRuntime = await readFile(new URL("../public/mcp/moss/v0.1.0-cb75ab0/moss.js", import.meta.url), "utf8");
const mossTokens = await readFile(new URL("../public/mcp/moss/v0.1.0-cb75ab0/tokens.css", import.meta.url), "utf8");
const mossDashboardIcons = await readFile(new URL("../public/mcp/moss/v0.1.0-cb75ab0/icons.js", import.meta.url), "utf8");
const mossDashboardPin = JSON.parse(await readFile(new URL("../public/mcp/moss/v0.1.0-cb75ab0/vendor.json", import.meta.url), "utf8"));
const siteLayout = await readFile(new URL("../src/layouts/Layout.astro", import.meta.url), "utf8");
const siteManifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const mcpManifest = JSON.parse(await readFile(new URL("../public/mcp/manifest.webmanifest", import.meta.url), "utf8"));
const workerSource = await readFile(new URL("./worker.ts", import.meta.url), "utf8");
const mossPage = await readFile(new URL("../public/moss/index.html", import.meta.url), "utf8");
const mossCatalogTheme = await readFile(new URL("../public/moss/theme.js", import.meta.url), "utf8");
const mossCatalogIcons = await readFile(new URL("../public/moss/icons.js", import.meta.url), "utf8");
const mossCatalogPack = await readFile(new URL("../public/moss/icon-packs/iconoir.js", import.meta.url), "utf8");
const mossCatalogBytes = await readFile(new URL("../public/moss/index.html", import.meta.url));
const mossVendorPin = JSON.parse(await readFile(new URL("../public/moss/vendor.json", import.meta.url), "utf8"));
const wranglerConfig = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
assert(dashboardScript.includes('disclosure.className = "category-disclosure"'), "policy groups have a separate disclosure control");
assert(dashboardScript.includes("renderPolicyCapabilities(category)"), "policy detail renders capability inventory");
assert(dashboardScript.includes("formatPolicyAge(category.ageDays)"), "policy detail renders rule age");
assert(dashboardScript.includes('disclosure.setAttribute("aria-expanded"'), "policy disclosure state is exposed accessibly");
assert(dashboardStyles.includes("--font-mono:") && dashboardStyles.includes("font-family: var(--font-mono)"), "technical text has a dedicated monospace role");
assert(dashboardStyles.includes("-webkit-line-clamp: 2"), "major-group descriptions remain readable in the tree");
assert(dashboardPage.includes('aria-controls="topbar-more-panel"'), "mobile utility actions use a labelled overflow control");
assert(dashboardPage.includes("data-theme-toggle") && !dashboardPage.includes("data-theme-choice"), "dashboard uses the Moss light-dark toggle instead of a theme dropdown");
assert(dashboardStyles.includes("--coral: #ff8156") && dashboardStyles.includes("--amber: #f5b83a"), "dark dashboard accents use the mascot palette");
assert(dashboardPage.includes('class="benchmark-module moss-narrative"'), "overview promotes one primary Moss narrative visualization");
assert(dashboardPage.includes('class="insight-grid"'), "overview groups supporting evidence below the primary visualization");
assert(dashboardScript.includes('`${greeting}, Brandon.`'), "overview greeting responds to the time of day");
assert(dashboardPage.includes('const mossVersion = "v0.1.0-cb75ab0"'), "dashboard pins the reviewed Moss revision");
assert(mossTheme.includes('/mcp/moss/v0.1.0-cb75ab0/theme.js'), "Moss theme follows the dashboard pin");
assert(dashboardPage.includes('<moss-rail class="sidebar"') && dashboardPage.includes("data-rail-toggle"), "dashboard uses the expandable Moss rail");
assert(dashboardPage.includes('data-label="Overview"') && dashboardPage.includes("data-rail-label"), "collapsed rail destinations expose Moss tooltips");
assert(dashboardPage.includes("moss-narrative") && dashboardPage.includes("moss-panel"), "dashboard marks shared Moss compositions");
assert(dashboardPage.includes("moss-panel__header") && dashboardPage.includes("moss-panel__body"), "dashboard uses Moss panel header and body contracts");
assert(dashboardPage.includes('class="check-strip evidence-grid"') && dashboardPage.includes("moss-details"), "dashboard uses a compact evidence grid and Moss details contract");
assert(dashboardPage.includes("moss-segmented") && dashboardPage.includes('aria-label="Client configuration"'), "client selector uses the Moss segmented contract");
assert(dashboardPage.includes('<html lang="en" data-concept="c">') && !dashboardPage.includes("data-concept-choice"), "Control Room is the selected product direction");
assert(dashboardPage.includes('class="rail-arrow"') && !dashboardPage.includes('<moss-icon name="expand-rail">'), "rail uses a minimal directional arrow");
assert(dashboardStyles.includes(".sidebar[collapsed] .rail-arrow") && dashboardStyles.includes("rotate(45deg)"), "rail arrow turns with the navigation state");
assert(dashboardScript.includes('node.className = "category-node"') && !dashboardScript.includes("createElement(\"i\")"), "policy hierarchy uses structural branches instead of dot markers");
assert(dashboardStyles.includes(".category-branch > .category-node::before") && dashboardStyles.includes(".category-branch > .category-node::after"), "policy hierarchy draws continuous elbow connectors");
assert(dashboardScript.includes('categories.filter(({ kind }) => kind === "group")') && dashboardScript.includes("categoryExpansionInitialized"), "policy groups start expanded without overwriting later user choices");
assert(dashboardPage.includes('data-view="guidelines"') && dashboardPage.includes('data-view="resources"'), "guidelines and resources are first-class dashboard views");
assert(dashboardPage.includes('id="payload-trend"') && !dashboardPage.includes("Visible answer output"), "overview charts release trends and omits the negligible answer-output delta");
assert(dashboardPage.includes("<moss-disclosure") && dashboardPage.includes("Method and caveats"), "evidence methodology starts in a disclosure");
assert(dashboardPage.includes('class="topbar-service"'), "live service status is available in the top bar");
assert(!dashboardPage.includes("Bullfrog") && !mcpManifest.name.includes("Bullfrog"), "current dashboard and manifest use the canonical brand name");
assert(!dashboardPage.includes('class="module ') && !dashboardPage.includes("command-button"), "dashboard has no obsolete local module or button bridges");
assert(mossTheme.includes('name: "brandoriv.mcp"') && mossTheme.includes('density: "balanced"'), "MCP defines a balanced product MossTheme");
assert(mossTheme.includes('primary: "#76dc58"') && mossTheme.includes('info: "#45c7c2"'), "MCP theme uses playful tree-frog colors with semantic accents");
assert(mossTheme.includes('charts: { barRadius: "0" }'), "MCP theme keeps analytical bars square");
assert(mossRuntime.includes('customElements.define("moss-rail"'), "vendored Moss runtime registers the shared rail");
assert(mossRuntime.includes('from "./icons.js"') && mossDashboardIcons.includes('customElements.define("moss-icon"'), "vendored Moss runtime ships the icon layer");
assert(dashboardPage.includes('rail-toggle moss-button moss-button--quiet moss-button--icon'), "dashboard rail arrow remains a Moss icon-button composition");
assert(!dashboardPage.includes("<Icon ") && !dashboardPage.includes("components/Icon.astro"), "dashboard draws every icon through the Moss contract");
assert(!dashboardScript.includes("<svg"), "dashboard injects Moss icons at runtime rather than inline SVG");
for (const iconName of [...dashboardPage.matchAll(/<moss-icon[^>]*name="([a-z-]+)"/g)].map((match) => match[1])) {
  if (!MOSS_ICON_NAMES.includes(iconName)) throw new Error(`Dashboard uses an icon name Moss does not define: ${iconName}`);
}
assert(!dashboardPage.includes("↔"), "dashboard rail toggle keeps no leftover arrow glyph");
assert(mossDashboardPin.revision === mossVendorPin.revision, "both vendored surfaces run the same Moss revision");
assert(mossTokens.includes("--moss-data-5") && mossTokens.includes('[data-moss-density="compact"]'), "vendored Moss tokens include data color and density contracts");
assert(dashboardStyles.includes("--canvas: var(--moss-canvas)"), "legacy MCP compositions consume Moss semantic tokens");
assert(dashboardStyles.includes("min-height: 142px") && dashboardStyles.includes("min-height: 178px"), "mobile overview composes summary and chart within a phone viewport");
assert(dashboardStyles.includes("max-height: 38dvh") && dashboardStyles.includes(".category-branch[hidden]"), "mobile policy navigation keeps a scrollable tree hierarchy");
assert(dashboardScript.includes('new CustomEvent("moss-toast"'), "dashboard feedback uses the Moss toast contract");
assert(siteLayout.includes('/favicon-32.png') && siteLayout.includes('/apple-touch-icon.png'), "site layout publishes flat mascot browser icons");
assert(siteManifest.icons.length === 2, "site manifest publishes 192 and 512 pixel mascot icons");
assert(mcpManifest.icons.length === 3, "MCP manifest retains the source mascot and app-size variants");
assert(workerSource.includes("serveMossCatalog(request, env.ASSETS, env.MCP_BEARER_TOKEN)"), "Moss catalog reuses dashboard authentication");
assert(workerSource.includes("hasValidDashboardSession(request, expectedToken)"), "Moss assets require a signed session");
assert(workerSource.includes('Location: "/mcp?next=%2Fmoss"'), "Moss authentication preserves the catalog destination without a redirect loop");
assert(dashboardScript.includes('sessionStorage.setItem("brandoriv-dashboard-next"'), "dashboard returns successful catalog sign-ins to Moss");
assert(!workerSource.includes('url.pathname = "/moss/index.html"'), "Moss leaves directory-index resolution to the asset binding to avoid canonical redirect loops");
assert(mossPage.includes('/moss/moss.css') && mossPage.includes('/moss/catalog.js'), "Moss catalog uses scoped production assets");
assert(mossCatalogTheme.includes("createMossTheme") && mossCatalogTheme.includes("densityScale"), "deployed catalog includes the structured theme contract");
assert(!mossCatalogTheme.includes("poison-dart-frog"), "deployed catalog theme carries no product inspiration presets");
assert(mossCatalogIcons.includes('customElements.define("moss-icon"') && mossCatalogPack.includes('name: "iconoir"'), "deployed catalog ships the icon element and its default pack");
assert(mossPage.includes("<moss-icon") && !/<span data-icon>/.test(mossPage), "deployed catalog draws icons as SVG rather than text glyphs");
// An earlier vendoring committed this file with a byte order mark and
// double-encoded UTF-8, which rendered as mojibake in the browser.
assert(mossCatalogBytes[0] !== 0xef, "deployed catalog carries no byte order mark");
assert(!/[^\u0000-\u007F]/.test(mossPage), "deployed catalog stays ASCII so it cannot be mis-decoded");
assert(/^[0-9a-f]{40}$/.test(mossVendorPin.revision), "deployed catalog records the Moss revision it was vendored from");
assert(wranglerConfig.includes('"pattern": "brandoriv.dev/moss*"'), "Cloudflare routes the private catalog through the worker");

console.log("MCP dashboard tests passed (68 checks).");

function requestWithCookie(value) {
  return new Request("https://brandoriv.dev/mcp/dashboard/data", { headers: { Cookie: value } });
}

function assert(condition, message) {
  if (!condition) throw new Error(`MCP dashboard test failed: ${message}`);
}
