import { createPolicyStore } from "./policy-store.ts";

const values = new Map();
const kv = {
  async get(key) { return values.has(key) ? JSON.parse(values.get(key)) : null; },
  async put(key, value) { values.set(key, value); },
};
const store = createPolicyStore(kv);
const original = (await store.list()).find(({ id }) => id === "communication");
assert(original.version === 1, "repository policy starts at v1");
const saved = await store.save({ ...original, content: `${original.content}\n\nNew rule.`, changeNote: "Test versioning" });
assert(saved.version === 2, "save creates the next immutable version");
assert((await store.list()).find(({ id }) => id === "communication").version === 2, "new version becomes active");
assert((await store.versions("communication")).length === 2, "history retains the prior version");
assert(values.has("version:communication:2"), "immutable version has its own key");
console.log("MCP policy store tests passed (5 checks).");

function assert(condition, message) {
  if (!condition) throw new Error(`MCP policy store test failed: ${message}`);
}
