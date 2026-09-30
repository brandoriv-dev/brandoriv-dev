import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const REQUIRED_VARS = {
  JEV_ROUTING_MODE: "off",
  TYPESAFE_ENDPOINT: "https://api.typesafe.ai/v1/systemone",
  TYPESAFE_MODEL: "jev-latest",
  JEV_ROUTE_THRESHOLD: "0.65",
  JEV_SEND_RAW_TASK: "0",
  JEV_TIMEOUT_MS: "1500",
  BSTACK_TOOLS_EVENT_ENDPOINT: "https://bstack.tools/api/v0/feedback",
};

export const REQUIRED_SECRETS = ["TYPESAFE_API_KEY", "BSTACK_TOOLS_EVENT_TOKEN"];

export function parseJsonc(text) {
  return JSON.parse(stripJsonComments(text));
}

export function stripJsonComments(text) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
      output += "\n";
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        output += text[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      i += 1;
      continue;
    }

    output += char;
  }

  return output;
}

export function auditConfig(config, options = {}) {
  const vars = config.vars ?? {};
  const secretNames = new Set(options.secretNames ?? []);
  const checkSecrets = Boolean(options.checkSecrets);
  const problems = [];
  const warnings = [];

  for (const [name, expected] of Object.entries(REQUIRED_VARS)) {
    if (!(name in vars)) {
      problems.push(`missing Worker var ${name}`);
      continue;
    }
    if (vars[name] !== expected) {
      problems.push(`Worker var ${name} must be ${expected}`);
    }
  }

  for (const name of REQUIRED_SECRETS) {
    if (name in vars) {
      problems.push(`${name} must be a Worker secret, not a committed var`);
    }
    if (checkSecrets && vars.MCP_RETIRED !== "true" && !secretNames.has(name)) {
      problems.push(`missing Worker secret ${name}`);
    }
  }

  if (vars.JEV_ROUTING_MODE !== "off") {
    problems.push("JEV_ROUTING_MODE must stay off by default in wrangler.jsonc");
  }
  if (vars.JEV_SEND_RAW_TASK !== "0") {
    problems.push("JEV_SEND_RAW_TASK must stay 0 by default");
  }

  if (!checkSecrets && vars.MCP_RETIRED !== "true") {
    warnings.push(`live Worker secrets were not checked; run with --live-secrets to verify ${REQUIRED_SECRETS.join(", ")}`);
  }

  return { ok: problems.length === 0, problems, warnings };
}

export function parseWranglerSecretList(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(secretNameFromEntry).filter(Boolean);
    if (Array.isArray(parsed.secrets)) return parsed.secrets.map(secretNameFromEntry).filter(Boolean);
  } catch {
    // Fall through to line parsing for human-readable Wrangler output.
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim().match(/^([A-Z][A-Z0-9_]+)\b/)?.[1])
    .filter(Boolean);
}

function secretNameFromEntry(entry) {
  if (typeof entry === "string") return entry;
  return entry?.name ?? entry?.secret_name ?? entry?.key;
}

function readLiveSecretNames() {
  const output = execFileSync("bunx", ["wrangler", "secret", "list", "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return parseWranglerSecretList(output);
}

function main(argv) {
  const liveSecrets = argv.includes("--live-secrets");
  const config = parseJsonc(readFileSync("wrangler.jsonc", "utf8"));
  const secretNames = liveSecrets ? readLiveSecretNames() : [];
  const result = auditConfig(config, { checkSecrets: liveSecrets, secretNames });

  for (const warning of result.warnings) console.log(`warn: ${warning}`);

  if (!result.ok) {
    for (const problem of result.problems) console.error(`error: ${problem}`);
    process.exitCode = 1;
    return;
  }

  const checked = liveSecrets ? "vars and live secret names" : "vars";
  console.log(`MCP config audit passed (${checked}; no secret values printed).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
