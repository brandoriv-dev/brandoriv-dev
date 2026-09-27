import { buildJevRequest, shadowJevRouting } from "./jev-router.ts";

const input = {
  task: "Review this Bicep deployment",
  language: "TypeScript",
  framework: "React",
  artifacts: ["main.bicep"],
  categories: ["research"],
};

const redacted = buildJevRequest(input, { model: "jev-latest" });
const redactedState = JSON.parse(redacted.state);
assert(redactedState.task === undefined, "redacted Jev state omits raw task text");
assert(redactedState.language === true, "redacted Jev state keeps coarse language presence");
assert(redactedState.framework === true, "redacted Jev state keeps coarse framework presence");
assert(redactedState.artifactCount === 1, "redacted Jev state keeps artifact count");
assert(JSON.stringify(redacted).includes("Bicep") === false, "redacted request does not leak raw task words");

const raw = buildJevRequest(input, { sendRawTask: true });
const rawState = JSON.parse(raw.state);
assert(rawState.task === input.task, "raw task text is sent only with explicit opt-in");

const logged = [];
await shadowJevRouting(
  input,
  {
    mode: "shadow",
    apiKey: "secret-key",
    threshold: 0.65,
    sendRawTask: false,
  },
  {
    deterministicIds: ["global", "communication", "code-review", "infrastructure-as-code"],
    logger: { log: (event) => logged.push(event) },
    fetcher: async (_url, init) => {
      assert(init.headers.Authorization === "Bearer secret-key", "Jev call uses bearer auth");
      assert(!init.body.includes(input.task), "Jev call body omits raw task text when redacted");
      return {
        ok: true,
        async json() {
          return {
            answers: {
              engineering: { type: "noul", noul: 0.75 },
              "infrastructure-as-code": { type: "noul", noul: 0.95 },
              "code-review": { type: "noul", noul: 0.9 },
              sql: { type: "noul", noul: 0.05 },
            },
            usage: { input_tokens: 100, output_tokens: 20 },
          };
        },
      };
    },
  }
);

assert(logged.length === 1, "Jev shadow logs one event");
assert(logged[0].type === "jev.routing.shadow", "Jev shadow logs the expected event type");
assert(logged[0].payload.status === "ok", "Jev shadow logs success status");
assert(logged[0].payload.sendsRawTask === false, "Jev shadow logs raw-task posture");
assert(logged[0].payload.candidateIds.includes("engineering"), "Jev shadow logs candidate categories");
assert(logged[0].payload.jevOnly.includes("engineering"), "Jev shadow logs candidate-only categories");
assert(!JSON.stringify(logged[0]).includes(input.task), "Jev shadow log omits raw task text");

const skipped = [];
await shadowJevRouting(
  input,
  { mode: "shadow" },
  {
    deterministicIds: ["global", "communication"],
    logger: { log: (event) => skipped.push(event) },
    fetcher: async () => {
      throw new Error("should not call without api key");
    },
  }
);
assert(skipped[0].payload.status === "skipped", "missing key logs a skipped shadow event");

console.log("MCP Jev router tests passed (17 checks).");

function assert(condition, message) {
  if (!condition) throw new Error(`MCP Jev router test failed: ${message}`);
}
