// Verifies the published catalog and dashboard pin behind the owner session.
// Mints the same session cookie the dashboard login issues, from MCP_BEARER_TOKEN
// in the environment. Never prints the token or the cookie.
const token = process.env.MCP_BEARER_TOKEN;
if (!token) throw new Error("Set MCP_BEARER_TOKEN.");
const encoder = new TextEncoder();
const expiresAt = Math.floor(Date.now() / 1000) + 300;
const key = await crypto.subtle.importKey("raw", encoder.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`brandoriv-mcp-dashboard.${expiresAt}`));
const hex = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
const cookie = `__Host-brandoriv_mcp_dashboard=${expiresAt}.${hex}`;

const get = async (path: string) => {
  const response = await fetch(`https://brandoriv.dev${path}`, { headers: { Cookie: cookie }, redirect: "manual" });
  return { status: response.status, body: await response.text() };
};

const catalog = await get("/moss/");
const dashboard = await get("/mcp");
const vendor = await get("/moss/vendor.json");
const result: Record<string, unknown> = {
  catalogStatus: catalog.status,
  dashboardStatus: dashboard.status,
  catalogRevision: (() => { try { return JSON.parse(vendor.body).revision?.slice(0, 7); } catch { return vendor.status; } })(),
  catalogVersionLabel: catalog.body.match(/Component catalog - v[0-9.]+/)?.[0] ?? null,
  dashboardPin: dashboard.body.match(/\/mcp\/moss\/(v[0-9.]+-[0-9a-f]+)\//)?.[1] ?? null
};
for (const marker of ['id="filtering"', "<moss-view-tabs", "<moss-filter-chips", "moss-table-shell__bar", "moss-table--stack", 'data-components="view-tabs filter-chips table-toolbar"']) {
  result[`catalog:${marker}`] = catalog.body.includes(marker);
}
const runtime = await get(`/mcp/moss/${result.dashboardPin}/moss.js`);
result["dashboardRuntimeStatus"] = runtime.status;
result["dashboardRuntimeDefinesViewTabs"] = runtime.body.includes('customElements.define("moss-view-tabs"');
console.log(JSON.stringify(result, null, 2));
