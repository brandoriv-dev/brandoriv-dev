import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
export const sourceVersionUrl = "https://func-moss-7b5a92e0b4c1.azurewebsites.net/api/version";

export async function verifyBundle(directory) {
  const root = resolve(directory);
  const manifest = JSON.parse(await readFile(resolve(root, "vendor.json"), "utf8"));
  assert.equal(manifest.format, 2, "Re-vendor Moss with the current asset manifest format");
  assert.match(manifest.revision, /^[a-f0-9]{40}$/, "Moss must be pinned to a full commit SHA");
  assert.equal(manifest.source, "https://github.com/brandoriv-dev/moss");
  assert(Array.isArray(manifest.files) && manifest.files.length > 0, "Missing asset inventory");
  assert.equal(new Set(manifest.files).size, manifest.files.length, "Duplicate asset paths");
  for (const file of manifest.files) {
    assert(typeof file === "string" && !isAbsolute(file) && !file.includes("\\") && !file.split("/").includes(".."), "Unsafe asset path");
    const path = resolve(root, file);
    assert(path.startsWith(root + sep), "Asset must stay inside its bundle");
    const hash = createHash("sha256").update(await readFile(path)).digest("hex");
    assert.equal(hash, manifest.sha256?.[file], `Moss asset changed or is missing its digest: ${file}`);
  }
  return manifest;
}

export async function verifyRelease(revision, fetchVersion = fetch) {
  const response = await fetchVersion(sourceVersionUrl, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
  assert(response.ok, `Cannot verify the live Moss release: HTTP ${response.status}`);
  const live = await response.json();
  assert.equal(revision, live.sha, `Stale Moss catalog. Re-vendor the verified release ${live.sha}, review, and publish the website.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalog = await verifyBundle(resolve(project, "public/moss"));
  for (const file of ["index.html", "charts.html", "app.js", "catalog-status.json", "src/core/theme.js", "src/charts.js", "src/vendor/echarts.esm.min.js", "src/vendor/geist/index.css"]) {
    assert(catalog.files.includes(file), `Incomplete Moss catalog: ${file}`);
  }
  const dashboard = await verifyBundle(resolve(project, `public/mcp/moss/v0.1.0-${catalog.revision.slice(0, 7)}`));
  assert.equal(dashboard.revision, catalog.revision, "Catalog and dashboard revisions differ");
  if (process.argv.includes("--against-live")) await verifyRelease(catalog.revision);
  console.log(`Verified Moss ${catalog.revision}: ${catalog.files.length} catalog and ${dashboard.files.length} dashboard assets${process.argv.includes("--against-live") ? ", matching Azure production" : ""}.`);
}
