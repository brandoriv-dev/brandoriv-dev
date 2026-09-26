/**
 * Vendor Moss into the two surfaces this repository serves:
 *
 *   catalog    public/moss              the authenticated /moss route
 *   dashboard  public/mcp/moss/<pin>/   the runtime the MCP dashboard loads
 *
 *   node mcp/vendor-moss.mjs ../moss                  both surfaces
 *   node mcp/vendor-moss.mjs ../moss --only catalog   one of them
 *
 * Files are read and written as UTF-8 without a BOM and with LF endings. An
 * earlier vendoring wrote them through a layer that re-encoded the bytes, which
 * left index.html and catalog.js double-encoded and showed as mojibake in the
 * browser, so this script asserts the result rather than trusting the copy.
 *
 * The dashboard pin is a versioned directory. Bumping it means running this
 * script and updating `mossVersion` in src/pages/mcp/index.astro to the path
 * this script prints. Superseded pins are left in place so a rollback is a
 * one-line revert.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, resolve, sep } from "node:path";

const source = resolve(process.argv[2] || "../moss");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex === -1 ? null : process.argv[onlyIndex + 1];

const revision = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const shortRevision = revision.slice(0, 7);
const dirty = execFileSync("git", ["-C", source, "status", "--porcelain"], { encoding: "utf8" }).trim();
if (dirty && !process.argv.includes("--allow-dirty")) {
  throw new Error(`Moss checkout at ${source} has uncommitted changes; vendor a committed revision.`);
}

// Everything Moss imports internally is relative and resolves unchanged inside
// either destination. Only the catalog page's own paths need rewriting.
const catalogRewrites = (text) => text
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
  },
  dashboard: {
    // The dashboard loads Moss from a versioned path so a pin change is visible
    // in the page source and cached copies never mix revisions.
    directory: `public/mcp/moss/v0.1.0-${shortRevision}`,
    files: [...runtime.map((file) => [file, file.slice(4)]), ["src/moss.css", "styles.css"]]
  }
};

function updateDashboardPin(version) {
  const pagePath = resolve(import.meta.dirname, "../src/pages/mcp/index.astro");
  const themePath = resolve(import.meta.dirname, "../public/mcp/moss-theme.js");
  const testPath = resolve(import.meta.dirname, "dashboard-test.mjs");
  const page = readFileSync(pagePath, "utf8");
  const pagePin = /const mossVersion = "v0\.1\.0-[0-9a-f]+";/;
  if (!pagePin.test(page)) throw new Error("src/pages/mcp/index.astro does not contain a replaceable Moss pin");
  writeFileSync(pagePath, page.replace(pagePin, `const mossVersion = "${version}";`));
  const theme = readFileSync(themePath, "utf8");
  const themePin = /\/mcp\/moss\/v0\.1\.0-[0-9a-f]+\/theme\.js/;
  if (!themePin.test(theme)) throw new Error("public/mcp/moss-theme.js does not contain a replaceable Moss pin");
  writeFileSync(themePath, theme.replace(themePin, `/mcp/moss/${version}/theme.js`));
  const test = readFileSync(testPath, "utf8");
  const testPin = /v0\.1\.0-[0-9a-f]+/g;
  if (!testPin.test(test)) throw new Error("mcp/dashboard-test.mjs does not contain a replaceable Moss pin");
  writeFileSync(testPath, test.replace(testPin, version));
}

if (only && !targets[only]) throw new Error(`Unknown target: ${only}. Expected ${Object.keys(targets).join(" or ")}.`);

for (const [name, target] of Object.entries(targets)) {
  if (only && only !== name) continue;
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

  if (name === "dashboard") updateDashboardPin(`v0.1.0-${shortRevision}`);

  console.log(`Vendored Moss ${shortRevision} into ${target.directory} (${target.files.length} files).`);
}

if (!only || only === "dashboard") {
  console.log(`Set mossVersion in src/pages/mcp/index.astro to "v0.1.0-${shortRevision}".`);
}
