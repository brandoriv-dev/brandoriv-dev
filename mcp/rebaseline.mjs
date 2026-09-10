// Regenerates policy-baseline.json from the current policy text and category
// definitions. Run this only when deliberately accepting the current policy as
// the new reference point for mcp:policy-eval.
//
//   bun run mcp:rebaseline
//
// The routing algorithm is frozen separately, by hand, in policy-baseline.mjs.
// If routing.ts changes shape, update that copy in the same commit.
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { categoryDefinitions } from "./routing.ts";

const commit = readCommit();
const policies = Object.fromEntries(
  await Promise.all(
    categoryDefinitions.map(async ({ id }) => [
      id,
      (await readFile(new URL(`./preferences/${id}.md`, import.meta.url), "utf8")).trim(),
    ])
  )
);

const snapshot = {
  commit,
  capturedAt: new Date().toISOString().slice(0, 10),
  categoryDefinitions: categoryDefinitions.map(({ id, title, keywords }) => ({
    id,
    title,
    keywords: [...keywords],
  })),
  policies,
};

const target = new URL("./policy-baseline.json", import.meta.url);
await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Wrote policy baseline at ${commit} (${Object.keys(policies).length} categories).`);

function readCommit() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}
