import { createEventLogger } from "./event-log.ts";

const sent = [];
const waited = [];
const logger = createEventLogger(
  {
    endpoint: "https://bstack.tools/api/v0/feedback",
    token: "secret-token",
    source: "test/mcp",
  },
  {
    waitUntil(promise) {
      waited.push(promise);
    },
  },
  async (url, init) => {
    sent.push({ url, init });
    return { ok: true, status: 202 };
  }
);

logger.log({
  type: "jev.routing.shadow",
  timestamp: "2026-09-27T00:00:00.000Z",
  payload: {
    status: "ok",
    taskLength: 42,
    deterministicIds: ["global", "communication"],
    candidateIds: ["global", "communication", "engineering"],
  },
});

assert(waited.length === 1, "event logging is scheduled through waitUntil");
await waited[0];

assert(sent.length === 1, "one event was sent");
assert(sent[0].url === "https://bstack.tools/api/v0/feedback", "event logger uses the configured endpoint");
assert(sent[0].init.headers.get("Authorization") === "Bearer secret-token", "event logger sends the configured bearer token");
const body = JSON.parse(sent[0].init.body);
assert(body.schemaVersion === 1, "event payload is versioned");
assert(body.source === "test/mcp", "event payload records its source");
assert(body.type === "jev.routing.shadow", "event payload records event type");
assert(!JSON.stringify(body).includes("secret-token"), "event payload does not include the logging token");

const consoleEvents = [];
const originalInfo = console.info;
console.info = (...args) => consoleEvents.push(args);
try {
  createEventLogger().log({
    type: "bstack.feedback.capture",
    payload: { status: "skipped", taskLength: 10 },
  });
} finally {
  console.info = originalInfo;
}
assert(consoleEvents.length === 1, "missing endpoint falls back to console");
assert(JSON.stringify(consoleEvents[0]).includes("payloadKeys"), "console fallback only records payload keys");

console.log("MCP event log tests passed (10 checks).");

function assert(condition, message) {
  if (!condition) throw new Error(`MCP event log test failed: ${message}`);
}
