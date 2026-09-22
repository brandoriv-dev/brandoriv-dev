/**
 * Vendor the Moss catalog into public/moss for the authenticated /moss route.
 *
 *   node mcp/vendor-moss.mjs ../moss
 *
 * Files are read and written as UTF-8 without a BOM and with LF endings. An
 * earlier vendoring wrote them through a layer that re-encoded the bytes, which
 * left index.html and catalog.js double-encoded and showed as mojibake in the
 * browser, so this script asserts the result rather than trusting the copy.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve(process.argv[2] || "../moss");
const target = resolve(import.meta.dirname, "..", "public/moss");

const revision = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const shortRevision = revision.slice(0, 7);
const dirty = execFileSync("git", ["-C", source, "status", "--porcelain"], { encoding: "utf8" }).trim();
if (dirty && !process.argv.includes("--allow-dirty")) {
  throw new Error(`Moss checkout at ${source} has uncommitted changes; vendor a committed revision.`);
}

// The catalog's own paths become absolute under /moss/. Everything Moss imports
// internally is already relative and resolves unchanged.
const rewrites = {
  "index.html": (text) => text
    .replace(/ *<link rel="preconnect"[^>]*>\n/g, "")
    .replace(/ *<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n/g, "")
    .replace('href="../src/moss.css"', 'href="/moss/moss.css"')
    .replace('href="styles.css"', 'href="/moss/catalog.css"')
    .replace('src="../src/moss.js"', 'src="/moss/moss.js"')
    .replace('src="app.js"', 'src="/moss/catalog.js"'),
  "catalog.js": (text) => text
    .replace('"../src/theme.js"', '"/moss/theme.js"')
    .replace('"./themes.js"', '"/moss/themes.js"')
};

const files = [
  ["src/tokens.css", "tokens.css"],
  ["src/moss.css", "moss.css"],
  ["src/moss.js", "moss.js"],
  ["src/theme.js", "theme.js"],
  ["src/icons.js", "icons.js"],
  ["src/icon-packs/iconoir.js", "icon-packs/iconoir.js"],
  ["docs/styles.css", "catalog.css"],
  ["docs/app.js", "catalog.js"],
  ["docs/themes.js", "themes.js"],
  ["docs/index.html", "index.html"]
];

const written = new Map();
for (const [from, to] of files) {
  const raw = readFileSync(resolve(source, from));
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) throw new Error(`${from} has a byte order mark`);
  const decoded = raw.toString("utf8");
  if (Buffer.compare(Buffer.from(decoded, "utf8"), raw) !== 0) throw new Error(`${from} is not valid UTF-8`);
  let text = decoded.replace(/\r\n/g, "\n");
  text = rewrites[to] ? rewrites[to](text) : text;
  const destination = resolve(target, to);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, Buffer.from(text, "utf8"));
  written.set(to, text);
}

// The catalog draws its icons as SVG and writes typographic characters as
// character references, so anything non-ASCII here means an encoding fault.
const stray = [...written.get("index.html")].find((character) => character.codePointAt(0) > 127);
if (stray) throw new Error(`index.html must stay ASCII; found ${JSON.stringify(stray)}`);

for (const reference of written.get("index.html").matchAll(/(?:href|src)="\/moss\/([^"]+)"/g)) {
  if (!written.has(reference[1])) throw new Error(`index.html references /moss/${reference[1]}, which was not vendored`);
}
for (const leftover of written.get("index.html").matchAll(/(?:href|src)="(\.\.?\/[^"]*)"/g)) {
  throw new Error(`index.html still points at the Moss checkout: ${leftover[1]}`);
}

writeFileSync(resolve(target, "vendor.json"), JSON.stringify({
  source: "https://github.com/BrandoRiv/moss",
  revision,
  vendored: new Date().toISOString().slice(0, 10),
  files: files.map(([, to]) => to)
}, null, 2) + "\n");

console.log(`Vendored Moss ${shortRevision} into public/moss (${files.length} files).`);
