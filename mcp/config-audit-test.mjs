import assert from "node:assert/strict";
import { auditConfig, parseJsonc, parseWranglerSecretList, stripJsonComments } from "./config-audit.mjs";

const parsed = parseJsonc(`{
  // Comment with "quotes" and a secret-ish TOKEN=value that must be ignored.
  "vars": {
    "JEV_ROUTING_MODE": "off",
    "TYPESAFE_ENDPOINT": "https://api.typesafe.ai/v1/systemone",
    "TYPESAFE_MODEL": "jev-latest",
    "JEV_ROUTE_THRESHOLD": "0.65",
    "JEV_SEND_RAW_TASK": "0",
    "JEV_TIMEOUT_MS": "1500",
    "BSTACK_TOOLS_EVENT_ENDPOINT": "https://bstack.tools/api/v0/feedback",
    "URL_WITH_SLASHES": "https://example.com//kept"
  }
}`);

assert.equal(parsed.vars.URL_WITH_SLASHES, "https://example.com//kept");
assert.equal(JSON.parse(stripJsonComments('{"text":"not // a comment"}')).text, "not // a comment");

assert.deepEqual(
  auditConfig(parsed, { checkSecrets: true, secretNames: ["TYPESAFE_API_KEY", "BSTACK_TOOLS_EVENT_TOKEN"] }),
  { ok: true, problems: [], warnings: [] }
);

assert.deepEqual(auditConfig(parsed).warnings, [
  "live Worker secrets were not checked; run with --live-secrets to verify TYPESAFE_API_KEY, BSTACK_TOOLS_EVENT_TOKEN",
]);

const unsafe = structuredClone(parsed);
unsafe.vars.JEV_ROUTING_MODE = "shadow";
unsafe.vars.JEV_SEND_RAW_TASK = "1";
unsafe.vars.TYPESAFE_API_KEY = "forbidden-secret-value";
const unsafeResult = auditConfig(unsafe, { checkSecrets: true, secretNames: ["TYPESAFE_API_KEY"] });
assert.equal(unsafeResult.ok, false);
assert(unsafeResult.problems.includes("Worker var JEV_ROUTING_MODE must be off"));
assert(unsafeResult.problems.includes("Worker var JEV_SEND_RAW_TASK must be 0"));
assert(unsafeResult.problems.includes("TYPESAFE_API_KEY must be a Worker secret, not a committed var"));
assert(unsafeResult.problems.includes("missing Worker secret BSTACK_TOOLS_EVENT_TOKEN"));
assert(!unsafeResult.problems.some((problem) => problem.includes("forbidden-secret-value")));

assert.deepEqual(parseWranglerSecretList('[{"name":"TYPESAFE_API_KEY"},{"name":"BSTACK_TOOLS_EVENT_TOKEN"}]'), [
  "TYPESAFE_API_KEY",
  "BSTACK_TOOLS_EVENT_TOKEN",
]);
assert.deepEqual(parseWranglerSecretList("TYPESAFE_API_KEY\nBSTACK_TOOLS_EVENT_TOKEN\n"), [
  "TYPESAFE_API_KEY",
  "BSTACK_TOOLS_EVENT_TOKEN",
]);

const retired = structuredClone(parsed);
retired.vars.MCP_RETIRED = "true";
assert.deepEqual(auditConfig(retired, { checkSecrets: true, secretNames: [] }), { ok: true, problems: [], warnings: [] });

console.log("MCP config audit tests passed.");
