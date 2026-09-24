#!/usr/bin/env node
// Checks the operation-record convention in Azure/README.md mechanically.
//
// WHAT IT CHECKS, AND WHAT IT REFUSES TO
//
// It checks shape: that a record says who changed what, when, what state it
// replaced, and -- separately -- what was and was not checked afterwards. It
// checks that records are reachable from their index, that applied operations name
// exact target and resulting-state identifiers, and that no credential-shaped
// string was committed.
//
// It does NOT judge whether the prose is true. Nothing here can tell a real
// verification from an invented one, and a lint that tried would push authors
// toward whatever wording passes -- leaving a journal that always says everything
// was checked, the precise failure Azure/README.md exists to prevent. Every rule
// below is therefore a shape rule: it can force an author to NAME something, never
// to be honest about it. Naming is enough, because a named claim is falsifiable by
// a reader and a vague one is not.
//
// WHY THE FIELDS ARE WHAT THEY ARE
//
// Status and Verified are split because one field carrying both facts is what
// destroyed the previous convention: 51 records grew 27 spellings of Status, most
// of them smuggling verification scope into an enum. Checked and Not checked are
// separate and both mandatory because claiming full coverage should cost a
// specific falsifiable sentence ("Not checked: nothing") while admitting a gap
// stays easy. Previous and Deployed exist because a Cloudflare Worker version is
// the one identifier no platform will keep for you and rollback depends on it.
// The journal is intentionally selective, however, so it cannot prove continuity
// across routine green deployments. That belongs in CI deployment receipts.
//
// Portable on purpose: no dependencies, same behaviour under node and bun, so the
// file drops into terrarium, slow-and-steady, moss and bullfrog unchanged.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const rewriteIndex = process.argv.includes('--index');
const BASELINE_FILE = join(root, 'scripts', 'changes-lint-baseline.txt');
// The baseline is closed. Records dated on or after this are held to the standard
// no matter what the baseline file says, so regenerating it cannot clear a new
// failure. There is deliberately no flag to rebuild it.
const BASELINE_CLOSED = '2026-09-24';
const SKIP = new Set(['node_modules', '.git', '.worktrees', 'dist', 'build', '.deploy-artifacts', '.astro']);

const STATUSES = ['planned', 'applied', 'partial', 'failed', 'rolled back'];
const VERIFIED = ['checked', 'partly', 'not checked', 'blocked'];
// Values that fill the slot while saying nothing. Allowed as a substring, rejected
// as the entire value.
const CONTENTLESS = new Set(['none', 'n/a', 'na', 'tbd', 'pending', 'unknown', 'yes', 'no', 'todo', '-', 'not checked', 'not verified']);
// Applied changes replaced something; planned ones have not yet.
const HAS_PRIOR_STATE = new Set(['applied', 'partial', 'rolled back']);

const FIELDS = [
  { key: 'status', names: ['Status'], hint: STATUSES.join(' | ') },
  { key: 'verified', names: ['Verified'], hint: VERIFIED.join(' | ') },
  { key: 'checked', names: ['Checked'], hint: 'what was checked and what was observed' },
  { key: 'notChecked', names: ['Not checked'], hint: 'what was not checked, why, and who can — or "nothing"' },
  { key: 'when', names: ['When (UTC)'], hint: 'ISO 8601; a full timestamp once the change is applied' },
  { key: 'actor', names: ['Actor'], hint: 'the agent or person, and who they acted for' },
  { key: 'target', names: ['Target'], hint: 'provider, exact resource identifier, and every affected route or scope' }
];
const OPTIONAL = { previous: ['Previous'], deployed: ['Deployed'], supersedes: ['Supersedes'], operation: ['Operation'], source: ['Source'] };
const REQUIRED_SECTIONS = ['Intent', 'Outcome'];

// Conservative on purpose: every pattern is a credential SHAPE, not a word that
// might appear in prose about a credential. "MCP_BEARER_TOKEN was rotated" is
// required by the convention and must stay legal.
const SECRET_PATTERNS = [
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, 'JSON Web Token'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/, 'Anthropic API key'],
  [/AccountKey=[A-Za-z0-9+/=]{20,}/, 'Azure storage account key'],
  [/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/, 'private key'],
  [/\bAuthorization:\s*Bearer\s+\S{20,}/i, 'Authorization header value'],
  [/\bSet-Cookie:\s*\S+=\S{16,}/i, 'Set-Cookie value'],
  [/\b(?:client_secret|ClientSecret)["'\s:=]+[A-Za-z0-9~._-]{20,}/, 'client secret value']
];

const TEMPLATE = FIELDS.map(f => `- ${f.names[0]}: <${f.hint}>`).join('\n');

// Everything is read with line endings normalised. Git hands these files back as
// CRLF on Windows checkouts and LF on the Linux runners, and a lint that only
// passes on the runner is worse than no lint -- it fails for the agent, at the
// keyboard, with a message about the wrong thing.
const read = path => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const baseline = new Set();
try {
  for (const line of read(BASELINE_FILE).split('\n')) {
    const entry = line.replace(/#.*$/, '').trim();
    if (entry) baseline.add(entry);
  }
} catch { /* no baseline: every record must conform */ }
const usedBaseline = new Set();

function walk(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.name === 'changes') found.push(full);
    else walk(full, found);
  }
  return found;
}

// <component>/changes indexes itself; Azure/changes has no README of its own and
// Azure/README.md carries both the convention and the history.
function indexFor(dir) {
  const own = join(dir, 'README.md');
  try { statSync(own); return own; } catch { return join(dir, '..', 'README.md'); }
}

const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accepts `- Name: value`, `- **Name:** value` and `- **Name**: value`. The corpus
// uses all three interchangeably and rejecting any of them buys nothing.
function fieldValue(header, names) {
  for (const name of names) {
    const match = header.match(new RegExp(`^[-*]\\s*(?:\\*\\*)?${escape(name)}(?:\\*\\*)?\\s*:\\s*(?:\\*\\*)?\\s*(.*)$`, 'im'));
    if (match) return match[1].replace(/\*\*/g, '').trim();
  }
  return null;
}

const problems = [];
const fail = (file, message) => problems.push(`${relative(root, file).split(sep).join('/')}: ${message}`);

let checked = 0;
let conformant = 0;
const dirs = walk(root);
for (const dir of dirs) {
  const index = indexFor(dir);
  const rel = path => relative(root, path).split(sep).join('/');
  let indexText = '';
  try { indexText = read(index); } catch {
    problems.push(`${rel(dir)}: no index README to link records from`);
  }

  const names = readdirSync(dir).filter(name => name.endsWith('.md') && name !== 'README.md').sort().reverse();

  // The index block is generated. A hand-appended list at a single end-of-file
  // point is a merge conflict on every concurrent record, and the conflict's
  // "take mine" resolution silently deletes the other agent's link.
  // Azure/changes is indexed by Azure/README.md one level up, so links are written
  // relative to the index rather than to the records directory.
  const prefix = relative(join(index, '..'), dir).split(sep).filter(Boolean).join('/');
  const block = names.map(name => {
    const title = (read(join(dir, name)).match(/^#\s+(.+)$/m) || [, name])[1].trim();
    return `- [${title}](${prefix ? `${prefix}/${name}` : name})`;
  }).join('\n');
  const marked = indexText.match(/(<!-- records:begin -->)([\s\S]*?)(<!-- records:end -->)/);
  if (rewriteIndex) {
    const next = marked
      ? indexText.replace(marked[0], `${marked[1]}\n${block}\n${marked[3]}`)
      : `${indexText.trimEnd()}\n\n<!-- records:begin -->\n${block}\n<!-- records:end -->\n`;
    if (next !== indexText) { writeFileSync(index, next); process.stdout.write(`Rewrote ${rel(index)}\n`); }
    indexText = next;
  } else if (!marked) {
    problems.push(`${rel(index)}: no generated record block; run "node scripts/changes-lint.mjs --index"`);
  } else if (marked[2].trim() !== block.trim()) {
    problems.push(`${rel(index)}: record block is stale; run "node scripts/changes-lint.mjs --index"`);
  }

  for (const name of names) {
    const file = join(dir, name);
    const text = read(file);
    const key = rel(file);
    checked++;

    // Enforced for every record, baselined or not.
    for (const [pattern, label] of SECRET_PATTERNS) {
      if (pattern.test(text)) fail(file, `contains what looks like a ${label}; records carry names and outcomes, never values`);
    }

    const dated = name.slice(0, 10);
    if (baseline.has(key)) {
      usedBaseline.add(key);
      if (dated >= BASELINE_CLOSED) {
        fail(file, `is in scripts/changes-lint-baseline.txt but dated on or after ${BASELINE_CLOSED}; the baseline is closed — fix the record instead`);
      } else { continue; }
    }
    conformant++;

    if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9.-]*\.md$/.test(name)) {
      fail(file, 'name must be YYYY-MM-DD-short-description.md in lowercase');
    }

    const header = text.split(/^## /m)[0];
    const sections = [...text.matchAll(/^## (.+)$/gm)].map(match => match[1].trim());
    const values = {};
    for (const { key: slot, names: aliases, hint } of FIELDS) {
      const value = fieldValue(header, aliases);
      if (value === null) fail(file, `no "${aliases[0]}" field (${hint})`);
      else if (!value) fail(file, `"${aliases[0]}" is empty (${hint})`);
      values[slot] = value;
    }
    for (const [slot, aliases] of Object.entries(OPTIONAL)) values[slot] = fieldValue(header, aliases);

    for (const section of REQUIRED_SECTIONS) {
      if (!sections.some(heading => heading.toLowerCase() === section.toLowerCase())) {
        fail(file, `missing "## ${section}" section`);
      }
    }

    // Code spans are usage documentation (`deploy --target <name>`), not gaps.
    const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    const placeholder = [...prose.matchAll(/<([a-z][^>\n]{3,})>/gi)]
      .find(match => !/^https?:|^mailto:|^[a-z-]+@|^!--/i.test(match[1]));
    if (placeholder) fail(file, `unfilled template placeholder <${placeholder[1]}>`);

    const status = (values.status || '').toLowerCase();
    const state = STATUSES.find(value => status === value);
    if (values.status && !state) {
      fail(file, `Status "${values.status}" must be exactly one of: ${STATUSES.join(', ')}. Scope and caveats belong in "Not checked", not here`);
    }

    const verified = (values.verified || '').toLowerCase();
    if (values.verified && !VERIFIED.includes(verified)) {
      fail(file, `Verified "${values.verified}" must be exactly one of: ${VERIFIED.join(', ')}`);
    }
    if (state === 'planned' && verified && verified !== 'not checked') {
      fail(file, `Status is planned but Verified is "${values.verified}"; nothing has happened yet to check`);
    }

    // The asymmetry that makes an honest record cheaper than a green one: claiming
    // total coverage requires writing a specific sentence, admitting a gap does not.
    for (const [slot, label] of [['checked', 'Checked'], ['notChecked', 'Not checked']]) {
      const value = (values[slot] || '').trim().replace(/[.\s]+$/, '').toLowerCase();
      if (!value) continue;
      if (CONTENTLESS.has(value) && !(slot === 'notChecked' && value === 'nothing')) {
        fail(file, `"${label}: ${values[slot]}" says nothing. Name the check and what it showed, or for full coverage write "Not checked: nothing"`);
      }
    }
    if (verified === 'checked' && values.notChecked && values.notChecked.trim().toLowerCase().replace(/[.\s]+$/, '') !== 'nothing') {
      fail(file, 'Verified is "checked" but "Not checked" names a gap; use "partly" or "blocked"');
    }
    if (['partly', 'blocked', 'not checked'].includes(verified) && values.notChecked?.trim().toLowerCase().replace(/[.\s]+$/, '') === 'nothing') {
      fail(file, `Verified is "${verified}" but "Not checked" is "nothing"; name what was not checked`);
    }

    if (values.when && values.when !== 'unknown') {
      const lead = values.when.replace(/`/g, '').split(/[ ;(]/)[0];
      if (!/^\d{4}-\d{2}-\d{2}/.test(lead)) fail(file, `"When (UTC)" must start with an ISO 8601 UTC date, found "${values.when}"`);
      else if (Number.isNaN(Date.parse(lead))) fail(file, `"When (UTC)" is not a real date: "${values.when}"`);
      else if (state && HAS_PRIOR_STATE.has(state) && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(lead)) {
        // Several production deploys happen per day here and filenames are date-only.
        fail(file, `"When (UTC)" needs a full timestamp once a change is applied, found "${values.when}"`);
      }
    }

    if (state && HAS_PRIOR_STATE.has(state)) {
      if (!values.previous) {
        fail(file, 'applied changes need a "Previous:" field naming the state this replaced (a version or revision id, or "unrecorded", or "none" for a first deployment) — rollback depends on it');
      }
      if (!values.deployed || CONTENTLESS.has(values.deployed.trim().toLowerCase())) {
        fail(file, 'applied changes need a concrete "Deployed:" identifier naming the state this operation created');
      }
      if (values.target && !(/`[^`\n]+`/.test(values.target) || /\/subscriptions\/[0-9a-f-]+\//i.test(values.target))) {
        fail(file, 'applied changes need an exact resource identifier in "Target:" (wrap the provider resource name or ID in backticks)');
      }
    }

    for (const [slot, label] of [['supersedes', 'Supersedes'], ['operation', 'Operation']]) {
      const value = values[slot];
      if (!value || slot !== 'supersedes') continue;
      for (const referenced of value.split(/[,;]/).map(item => item.trim().replace(/^\[|\]$/g, '')).filter(item => item.endsWith('.md'))) {
        try { statSync(join(dir, referenced)); } catch { fail(file, `${label} names "${referenced}", which does not exist in this journal`); }
      }
    }

  }
}

for (const entry of baseline) {
  if (!usedBaseline.has(entry)) problems.push(`scripts/changes-lint-baseline.txt: "${entry}" no longer exists; remove this line`);
}

if (problems.length) {
  process.stderr.write(`Operation records: ${problems.length} problem${problems.length === 1 ? '' : 's'} in ${checked} record${checked === 1 ? '' : 's'}.\n\n`);
  for (const problem of problems) process.stderr.write(`  ${problem}\n`);
  process.stderr.write(`\nEvery record needs these fields, plus "## Intent" and "## Outcome" sections:\n\n${TEMPLATE}\n`);
  process.stderr.write('\nExtra sections are encouraged; what could not be checked, and risks accepted,\n');
  process.stderr.write('are the parts a later reader needs. Do not add records to\n');
  process.stderr.write('scripts/changes-lint-baseline.txt to clear this — the baseline is closed.\n');
  process.exit(1);
}

const grandfathered = checked - conformant;
process.stdout.write(
  `Operation records valid: ${conformant} of ${checked} checked across ${dirs.length} journal${dirs.length === 1 ? '' : 's'}` +
  `${grandfathered ? `; ${grandfathered} pre-${BASELINE_CLOSED} record${grandfathered === 1 ? '' : 's'} baselined` : ''}.\n`
);
