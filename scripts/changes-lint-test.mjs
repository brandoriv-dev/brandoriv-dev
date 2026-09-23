// Runs scripts/changes-lint.mjs against throwaway fixture repositories, so the lint
// is tested through the interface CI actually uses: exit code and stderr.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const lintSource = fileURLToPath(new URL("./changes-lint.mjs", import.meta.url));
const repoRoot = join(dirname(lintSource), "..");

const GOOD = `# Publish the widget route

- Status: applied
- Verified: checked
- Checked: an anonymous GET of /widget returned 200 with the expected body
- Not checked: nothing
- When (UTC): 2026-09-25T04:10:00Z
- Actor: Claude Opus 5 for the repository owner
- Target: Cloudflare Worker \`example\`, route /widget
- Previous: 11111111-aaaa
- Deployed: 22222222-bbbb

## Intent

The widget route did not exist.

## Outcome

Worker version 22222222-bbbb serves /widget.
`;

function fixture(records, { baseline = null, index = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "changes-lint-"));
  mkdirSync(join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, "widget", "changes"), { recursive: true });
  cpSync(lintSource, join(dir, "scripts", "changes-lint.mjs"));
  for (const [name, body] of Object.entries(records)) writeFileSync(join(dir, "widget", "changes", name), body);
  writeFileSync(join(dir, "widget", "changes", "README.md"), index ?? "# Widget changes\n\n<!-- records:begin -->\n<!-- records:end -->\n");
  if (baseline !== null) writeFileSync(join(dir, "scripts", "changes-lint-baseline.txt"), baseline);
  // Every fixture starts with a correct index block so index staleness does not
  // mask the rule under test.
  run(dir, ["--index"]);
  return dir;
}

function run(dir, args = []) {
  try {
    return { code: 0, output: execFileSync(process.execPath, ["scripts/changes-lint.mjs", ...args], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

const cases = [];
const check = (name, records, expect, options) => cases.push([name, records, expect, options]);
const swap = (find, replace) => GOOD.replace(find, replace);

check("a conformant record passes", { "2026-09-25-widget.md": GOOD }, null);

// Status and Verified are separate axes; the lint must never suggest merging them.
check("Status carrying a qualifier fails", { "2026-09-25-widget.md": swap("Status: applied", "Status: applied with rendering pending") }, /must be exactly one of/);
check("a Status synonym fails", { "2026-09-25-widget.md": swap("Status: applied", "Status: completed") }, /must be exactly one of/);
check("the failure never tells the author to assert a check", { "2026-09-25-widget.md": swap("Status: applied", "Status: deployed") }, /^(?!.*and verified).*$/s);
check("a bad Verified value fails", { "2026-09-25-widget.md": swap("Verified: checked", "Verified: yes") }, /Verified "yes" must be exactly one of/);
check("planned work cannot claim a check", { "2026-09-25-widget.md": swap("Status: applied", "Status: planned").replace("When (UTC): 2026-09-25T04:10:00Z", "When (UTC): 2026-09-25") }, /nothing has happened yet to check/);

// The asymmetry: claiming full coverage costs a specific sentence.
check("contentless Checked fails", { "2026-09-25-widget.md": swap("Checked: an anonymous GET of /widget returned 200 with the expected body", "Checked: none") }, /says nothing/);
check("contentless Not checked fails", { "2026-09-25-widget.md": swap("Not checked: nothing", "Not checked: n/a") }, /says nothing/);
check("Verified checked while naming a gap fails", { "2026-09-25-widget.md": swap("Not checked: nothing", "Not checked: the authenticated render, no signed session, Brandon") }, /use "partly" or "blocked"/);
check("Verified partly with no named gap fails", { "2026-09-25-widget.md": swap("Verified: checked", "Verified: partly") }, /name what was not checked/);
check("blocked with a named gap passes", {
  "2026-09-25-widget.md": swap("Verified: checked", "Verified: blocked").replace("Not checked: nothing", "Not checked: authenticated /widget render — needs a signed owner session — Brandon")
}, null);

// Rollback is what the journal is for.
check("an applied record without Previous fails", { "2026-09-25-widget.md": swap("- Previous: 11111111-aaaa\n", "") }, /rollback depends on it/);
check("a date-only timestamp on an applied change fails", { "2026-09-25-widget.md": swap("When (UTC): 2026-09-25T04:10:00Z", "When (UTC): 2026-09-25") }, /needs a full timestamp/);
check("a stale rollback target fails", {
  "2026-09-25-a.md": GOOD,
  "2026-09-25-b.md": swap("When (UTC): 2026-09-25T04:10:00Z", "When (UTC): 2026-09-25T05:00:00Z").replace("Previous: 11111111-aaaa", "Previous: 11111111-aaaa").replace("Deployed: 22222222-bbbb", "Deployed: 33333333-cccc")
}, /would also revert everything in between/);
check("a continuous chain passes", {
  "2026-09-25-a.md": GOOD,
  "2026-09-25-b.md": swap("When (UTC): 2026-09-25T04:10:00Z", "When (UTC): 2026-09-25T05:00:00Z").replace("Previous: 11111111-aaaa", "Previous: 22222222-bbbb").replace("Deployed: 22222222-bbbb", "Deployed: 33333333-cccc")
}, null);

check("a missing section fails", { "2026-09-25-widget.md": swap("## Outcome", "## Results") }, /missing "## Outcome"/);
check("an extra section is allowed", { "2026-09-25-widget.md": `${GOOD}\n## Risk accepted\n\nThe smoke suite was already red on main.\n` }, null);
check("an unfilled placeholder fails", { "2026-09-25-widget.md": swap("The widget route did not exist.", "<why this was needed>") }, /unfilled template placeholder/);
check("a placeholder in a code span is usage documentation", { "2026-09-25-widget.md": swap("The widget route did not exist.", "Run `deploy --target <name>`.") }, null);
check("a committed credential fails", { "2026-09-25-widget.md": swap("- Deployed: 22222222-bbbb", "- Deployed: 22222222-bbbb\n- Token: ghp_0123456789abcdefghijklmnopqrstuvwxyz") }, /GitHub token/);
check("Supersedes naming a missing record fails", { "2026-09-25-widget.md": swap("- Deployed: 22222222-bbbb", "- Deployed: 22222222-bbbb\n- Supersedes: 2026-01-01-gone.md") }, /does not exist in this journal/);
check("the bold field form is accepted", { "2026-09-25-widget.md": GOOD.replace(/^- (Status|Verified|Checked|Not checked|When \(UTC\)|Actor|Target|Previous|Deployed):/gm, "- **$1:**") }, null);

// The baseline is closed: it cannot be used to clear a new record.
check("a pre-cutoff record may be baselined", { "2026-09-01-old.md": "# Old\n\nNo fields at all.\n" }, null, { baseline: "widget/changes/2026-09-01-old.md\n" });
check("a post-cutoff record cannot be baselined", { "2026-09-25-widget.md": "# New\n\nNo fields at all.\n" }, /the baseline is closed/, { baseline: "widget/changes/2026-09-25-widget.md\n" });
check("a baselined record still fails secret scanning", { "2026-09-01-old.md": "# Old\n\nghp_0123456789abcdefghijklmnopqrstuvwxyz\n" }, /GitHub token/, { baseline: "widget/changes/2026-09-01-old.md\n" });
check("a stale baseline entry fails", { "2026-09-25-widget.md": GOOD }, /no longer exists/, { baseline: "widget/changes/2026-09-25-gone.md\n" });

let failures = 0;
for (const [name, records, expect, options] of cases) {
  const dir = fixture(records, options ?? {});
  try {
    const { code, output } = run(dir);
    const ok = expect === null ? code === 0 : code !== 0 && expect.test(output);
    if (!ok) { failures++; process.stderr.write(`FAIL ${name}\n  exit ${code}${expect ? `, expected ${expect}` : ", expected 0"}:\n${output}\n`); }
    else process.stdout.write(`  ok  ${name}\n`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Git checks these files out as CRLF on Windows and LF on the Linux runners. A
// lint that only passes on the runner fails the agent at the keyboard, with a
// message about the wrong thing -- this shipped once and must not again.
{
  const dir = fixture({ "2026-09-25-widget.md": GOOD });
  for (const path of [join(dir, "widget", "changes", "2026-09-25-widget.md"), join(dir, "widget", "changes", "README.md"), join(dir, "scripts", "changes-lint-baseline.txt")]) {
    try { writeFileSync(path, readFileSync(path, "utf8").replace(/\n/g, "\r\n")); } catch { /* baseline absent in this fixture */ }
  }
  const { code, output } = run(dir);
  assert.equal(code, 0, `CRLF checkouts must lint identically to LF:\n${output}`);
  rmSync(dir, { recursive: true, force: true });
  process.stdout.write("  ok  CRLF files lint the same as LF\n");
}

// A stale index block must fail, and --index must fix it.
{
  const dir = fixture({ "2026-09-25-widget.md": GOOD });
  const index = join(dir, "widget", "changes", "README.md");
  writeFileSync(index, readFileSync(index, "utf8").replace(/- \[.*\]\(.*\)/, "- [wrong](2026-01-01-nope.md)"));
  assert.match(run(dir).output, /record block is stale/, "a hand-edited index block must fail");
  run(dir, ["--index"]);
  assert.equal(run(dir).code, 0, "--index must repair the block");
  rmSync(dir, { recursive: true, force: true });
  process.stdout.write("  ok  a stale index block fails and --index repairs it\n");
}

const live = run(repoRoot);
assert.equal(live.code, 0, `changes-lint must pass against this repository:\n${live.output}`);
process.stdout.write("  ok  the repository's own records pass\n");

if (failures) {
  process.stderr.write(`\nchanges-lint: ${failures} test${failures === 1 ? "" : "s"} failed.\n`);
  process.exit(1);
}
process.stdout.write(`changes-lint: ${cases.length + 3} tests passed.\n`);
