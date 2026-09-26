import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyBundle, verifyRelease } from "./moss-catalog-check.mjs";

const root = await mkdtemp(join(tmpdir(), "moss-bundle-test-"));
const revision = "a".repeat(40);
const bytes = Buffer.from([0, 255, 128, 1]);
const manifest = { format: 2, source: "https://github.com/brandoriv-dev/moss", revision, files: ["font.woff2"], sha256: { "font.woff2": createHash("sha256").update(bytes).digest("hex") } };
try {
  await writeFile(join(root, "font.woff2"), bytes);
  await writeFile(join(root, "vendor.json"), JSON.stringify(manifest));
  assert.equal((await verifyBundle(root)).revision, revision);
  await writeFile(join(root, "font.woff2"), "corrupted");
  await assert.rejects(verifyBundle(root), /Moss asset changed/);
  await writeFile(join(root, "font.woff2"), bytes);
  await writeFile(join(root, "vendor.json"), JSON.stringify({ ...manifest, files: ["../outside"] }));
  await assert.rejects(verifyBundle(root), /Unsafe asset path/);
  await writeFile(join(root, "vendor.json"), JSON.stringify({ ...manifest, files: ["missing.js"] }));
  await assert.rejects(verifyBundle(root), /ENOENT/);
  await writeFile(join(root, "vendor.json"), JSON.stringify({ ...manifest, revision: "main" }));
  await assert.rejects(verifyBundle(root), /full commit SHA/);
  await verifyRelease(revision, async () => Response.json({ sha: revision }));
  await assert.rejects(verifyRelease(revision, async () => Response.json({ sha: "b".repeat(40) })), /Stale Moss catalog/);
  await assert.rejects(verifyRelease(revision, async () => new Response(null, { status: 503 })), /HTTP 503/);
  await assert.rejects(verifyRelease(revision, async () => { throw new Error("network unavailable"); }), /network unavailable/);
  console.log("Moss catalog: 9 integrity and release-gate checks passed.");
} finally {
  assert(root.startsWith(join(tmpdir(), "moss-bundle-test-")));
  await rm(root, { recursive: true, force: true });
}
