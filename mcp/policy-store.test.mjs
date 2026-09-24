import { createPolicyStore } from "./policy-store.ts";
import { createDashboardData } from "./dashboard.ts";
import { categories } from "./preferences.ts";
import { categoryDefinitions } from "./routing.ts";

const values = new Map();
const kv = {
  async get(key) { return values.has(key) ? JSON.parse(values.get(key)) : null; },
  async put(key, value) { values.set(key, value); },
};
const store = createPolicyStore(kv);
const catalog = await store.list();
const majorGroups = catalog.filter(({ kind, parentId }) => kind === "group" && parentId === null);
assert(majorGroups.length === 6, "catalog includes every major group");
assert(majorGroups.every(({ description }) => description), "every major group has a UI description");
assert(new Set(catalog.map(({ id }) => id)).size === catalog.length, "catalog ids are globally unique");
assert(
  JSON.stringify(categories.map(({ id }) => id)) === JSON.stringify(categoryDefinitions.map(({ id }) => id)),
  "policy categories match routing definitions"
);
const frontend = catalog.find(({ id }) => id === "frontend-design");
assert(frontend.reviewedAt, "policies record their last review");
assert(frontend.relatedSkills.includes("frontend-design-workflow"), "frontend policy records its coordinating skill");
assert(frontend.relatedTools.includes("figma-mcp") && frontend.relatedTools.includes("browser-automation"), "frontend policy records design tools");
assert(catalog.some(({ id, kind }) => id === "command:grill-me" && kind === "command"), "grill-me has a separate command identity");
const original = (await store.list()).find(({ id }) => id === "communication");
assert(original.version === 1, "repository policy starts at v1");
const saved = await store.save({ ...original, content: `${original.content}\n\nNew rule.`, changeNote: "Test versioning" });
assert(saved.version === 2, "save creates the next immutable version");
assert((await store.list()).find(({ id }) => id === "communication").version === 2, "new version becomes active");
assert((await store.versions("communication")).length === 2, "history retains the prior version");
assert(values.has("version:communication:2"), "immutable version has its own key");
assert(saved.reviewedAt === saved.updatedAt, "saving policy content refreshes its review timestamp");
const dashboard = await createDashboardData(new Date("2026-09-24T00:00:00.000Z"), undefined, store);
const dashboardFrontend = dashboard.categories.find(({ id }) => id === "frontend-design");
assert(dashboardFrontend.ageDays === 0, "dashboard derives policy age from the review timestamp");
assert(dashboardFrontend.relatedSkills.includes("frontend-design-workflow"), "dashboard inventory retains compiled skill metadata");
console.log("MCP policy store tests passed (16 checks).");

function assert(condition, message) {
  if (!condition) throw new Error(`MCP policy store test failed: ${message}`);
}
