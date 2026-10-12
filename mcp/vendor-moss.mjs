/**
 * Vendor the Moss catalog into public/moss, which the Worker serves at /moss:
 *
 *   node mcp/vendor-moss.mjs ../moss
 *
 * Files are read and written as UTF-8 without a BOM and with LF endings. An
 * earlier vendoring wrote them through a layer that re-encoded the bytes, which
 * left index.html and catalog.js double-encoded and showed as mojibake in the
 * browser, so this script asserts the result rather than trusting the copy.
 *
 * The retired MCP dashboard also loaded a pinned copy from public/mcp/moss; that
 * target was removed with the MCP surface on 2026-10-12.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, resolve, sep } from "node:path";

const source = resolve(process.argv[2] || "../moss");

const revision = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const shortRevision = revision.slice(0, 7);
const dirty = execFileSync("git", ["-C", source, "status", "--porcelain"], { encoding: "utf8" }).trim();
if (dirty && !process.argv.includes("--allow-dirty")) {
  throw new Error(`Moss checkout at ${source} has uncommitted changes; vendor a committed revision.`);
}

// Everything Moss imports internally is relative and resolves unchanged inside
// the destination. Only the catalog page's own paths need rewriting.
const catalogRewrites = (text) => text
  .replace('<meta charset="UTF-8">\n', '<meta charset="UTF-8">\n  <base href="/moss/">\n')
  .replaceAll("../src/", "/moss/src/")
  .replaceAll("../design/", "/moss/design/");

// The runtime every Moss adopter needs. The catalog adds its own page on top.
const tracked = execFileSync("git", ["-C", source, "ls-files", "src", "docs", "design", "THIRD-PARTY-NOTICES.md"], { encoding: "utf8" })
  .trim().split(/\r?\n/);
const runtime = tracked.filter((file) => file.startsWith("src/") && !["src/hosting.js", "src/build-info.json"].includes(file));

const targets = {
  catalog: {
    directory: "public/moss",
    files: [...runtime, ...tracked.filter((file) => !file.startsWith("src/"))]
      .map((file) => [file, file.replace(/^docs\//, "")])
  }
};

for (const [name, target] of Object.entries(targets)) {
  const root = resolve(import.meta.dirname, "..", target.directory);
  const written = new Map();
  const hashes = {};
  const previous = existsSync(resolve(root, "vendor.json"))
    ? JSON.parse(readFileSync(resolve(root, "vendor.json"), "utf8")) : null;

  for (const [from, to] of target.files) {
    const raw = readFileSync(resolve(source, from));
    let bytes = raw;
    let text;
    if (/\.(?:html|js|css|json|md|txt|svg)$/.test(from)) {
      if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) throw new Error(`${from} has a byte order mark`);
      text = new TextDecoder("utf-8", { fatal: true }).decode(raw).replace(/\r\n/g, "\n");
      if (name === "catalog" && from.startsWith("docs/")) text = catalogRewrites(text);
      bytes = Buffer.from(text, "utf8");
    }
    const destination = resolve(root, to);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes);
    hashes[to] = createHash("sha256").update(bytes).digest("hex");
    written.set(to, text);
  }

  const page = written.get("index.html");
  if (page) {
    // The catalog draws its icons as SVG and writes typographic characters as
    // character references, so anything non-ASCII here means an encoding fault.
    const stray = [...page].find((character) => character.codePointAt(0) > 127);
    if (stray) throw new Error(`index.html must stay ASCII; found ${JSON.stringify(stray)}`);
    for (const reference of page.matchAll(/(?:href|src)="\/moss\/([^"]+)"/g)) {
      if (!written.has(reference[1])) throw new Error(`index.html references /moss/${reference[1]}, which was not vendored`);
    }
    for (const leftover of page.matchAll(/(?:href|src)="(\.\.?\/[^"]*)"/g)) {
      throw new Error(`index.html still points at the Moss checkout: ${leftover[1]}`);
    }
  }

  // Remove only previously recorded generated assets, never unknown product files.
  for (const file of previous?.files || []) {
    if (isAbsolute(file) || file.includes("\\") || file.split("/").includes("..") || !resolve(root, file).startsWith(root + sep)) throw new Error("Unsafe previous manifest path");
    if (!written.has(file) && existsSync(resolve(root, file))) unlinkSync(resolve(root, file));
  }

  writeFileSync(resolve(root, "vendor.json"), JSON.stringify({
    format: 2,
    source: "https://github.com/brandoriv-dev/moss",
    revision,
    vendored: new Date().toISOString().slice(0, 10),
    files: target.files.map(([, to]) => to),
    sha256: hashes
  }, null, 2) + "\n");

  console.log(`Vendored Moss ${shortRevision} into ${target.directory} (${target.files.length} files).`);
}
