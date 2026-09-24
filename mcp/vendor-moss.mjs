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
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

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
const catalogRewrites = {
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

// The runtime every Moss adopter needs. The catalog adds its own page on top.
const runtime = [
  ["src/tokens.css", "tokens.css"],
  ["src/moss.js", "moss.js"],
  ["src/theme.js", "theme.js"],
  ["src/icons.js", "icons.js"],
  ["src/icon-packs/iconoir.js", "icon-packs/iconoir.js"]
];

const targets = {
  catalog: {
    directory: "public/moss",
    rewrites: catalogRewrites,
    files: [
      ...runtime,
      ["src/moss.css", "moss.css"],
      ["docs/styles.css", "catalog.css"],
      ["docs/app.js", "catalog.js"],
      ["docs/themes.js", "themes.js"],
      ["docs/index.html", "index.html"]
    ]
  },
  dashboard: {
    // The dashboard loads Moss from a versioned path so a pin change is visible
    // in the page source and cached copies never mix revisions.
    directory: `public/mcp/moss/v0.1.0-${shortRevision}`,
    rewrites: {},
    files: [...runtime, ["src/moss.css", "styles.css"]]
  }
};

function updateDashboardPin(version) {
  const pagePath = resolve(import.meta.dirname, "../src/pages/mcp/index.astro");
  const themePath = resolve(import.meta.dirname, "../public/mcp/moss-theme.js");
  const page = readFileSync(pagePath, "utf8");
  const pagePin = /const mossVersion = "v0\.1\.0-[0-9a-f]+";/;
  if (!pagePin.test(page)) throw new Error("src/pages/mcp/index.astro does not contain a replaceable Moss pin");
  writeFileSync(pagePath, page.replace(pagePin, `const mossVersion = "${version}";`));
  const theme = readFileSync(themePath, "utf8");
  const themePin = /\/mcp\/moss\/v0\.1\.0-[0-9a-f]+\/theme\.js/;
  if (!themePin.test(theme)) throw new Error("public/mcp/moss-theme.js does not contain a replaceable Moss pin");
  writeFileSync(themePath, theme.replace(themePin, `/mcp/moss/${version}/theme.js`));
}

if (only && !targets[only]) throw new Error(`Unknown target: ${only}. Expected ${Object.keys(targets).join(" or ")}.`);

for (const [name, target] of Object.entries(targets)) {
  if (only && only !== name) continue;
  const root = resolve(import.meta.dirname, "..", target.directory);
  const written = new Map();

  for (const [from, to] of target.files) {
    const raw = readFileSync(resolve(source, from));
    if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) throw new Error(`${from} has a byte order mark`);
    const decoded = raw.toString("utf8");
    if (Buffer.compare(Buffer.from(decoded, "utf8"), raw) !== 0) throw new Error(`${from} is not valid UTF-8`);
    let text = decoded.replace(/\r\n/g, "\n");
    text = target.rewrites[to] ? target.rewrites[to](text) : text;
    const destination = resolve(root, to);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, Buffer.from(text, "utf8"));
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

  writeFileSync(resolve(root, "vendor.json"), JSON.stringify({
    source: "https://github.com/BrandoRiv/moss",
    revision,
    vendored: new Date().toISOString().slice(0, 10),
    files: target.files.map(([, to]) => to)
  }, null, 2) + "\n");

  if (name === "dashboard") updateDashboardPin(`v0.1.0-${shortRevision}`);

  console.log(`Vendored Moss ${shortRevision} into ${target.directory} (${target.files.length} files).`);
}

if (!only || only === "dashboard") {
  console.log(`Set mossVersion in src/pages/mcp/index.astro to "v0.1.0-${shortRevision}".`);
}
