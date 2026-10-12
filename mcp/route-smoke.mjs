// Route smoke test against a running Worker (wrangler dev serving the built dist/).
// Start the Worker with an empty LEDGER_ORIGIN so /ledger answers without Azure:
//
//   bunx wrangler dev --local --port 8791 --var LEDGER_ORIGIN:
//   ROUTE_SMOKE_URL=http://127.0.0.1:8791 node mcp/route-smoke.mjs
import assert from "node:assert/strict";

const base = process.env.ROUTE_SMOKE_URL || "http://127.0.0.1:8791";
let checks = 0;

async function check(name, method, path, expectStatus, inspect) {
  const response = await fetch(new URL(path, base), {
    method,
    redirect: "manual",
    ...(method === "POST" ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}),
  });
  try {
    assert.equal(response.status, expectStatus, `${method} ${path}`);
    if (inspect) await inspect(response);
  } catch (error) {
    throw new Error(`Route smoke failed: ${name}`, { cause: error });
  }
  checks += 1;
}

await check("portfolio home", "GET", "/", 200, async (response) => {
  assert.match(response.headers.get("Content-Type") ?? "", /text\/html/);
  assert.match(await response.text(), /Brandon Rivera/);
});

await check("Moss bare route redirects to its directory", "GET", "/moss?page=structure", 308, (response) => {
  assert.equal(response.headers.get("Location"), "/moss/?page=structure");
});
await check("Moss catalog with security headers", "GET", "/moss/", 200, async (response) => {
  assert.match(response.headers.get("Content-Security-Policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.match(await response.text(), /<base href="\/moss\/">/);
});
await check("Moss asset", "GET", "/moss/vendor.json", 200);
await check("Moss rejects writes", "POST", "/moss/", 405, (response) => {
  assert.equal(response.headers.get("Allow"), "GET, HEAD");
});

for (const [method, path] of [["GET", "/mcp"], ["POST", "/mcp"], ["GET", "/mcp/"], ["GET", "/mcp/anything"], ["GET", "/mcp/health"]]) {
  await check(`retired MCP tombstone ${path}`, method, path, 410, async (response) => {
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(await response.text(), "This MCP service has been retired.\n");
  });
}
await check("retired MCP tombstone HEAD", "HEAD", "/mcp", 410, async (response) => {
  assert.equal(await response.text(), "");
});

await check("retired Harness has no route", "GET", "/harness", 404);
await check("Ledger without a configured origin", "GET", "/ledger", 503, async (response) => {
  assert.equal(await response.text(), "Ledger is not configured.");
});

console.log(`Route smoke passed (${checks} checks against ${base}).`);
