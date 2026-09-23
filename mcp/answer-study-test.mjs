// Deterministic tests for the answer-study scoring and file-patching logic, using
// fixture transcripts instead of a live API call. This is what mcp:build actually
// gates; the live study itself is separate because it costs real provider usage
// and is not bit-for-bit reproducible.
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseJudgeJson, writeEvaluationSnapshot } from "./answer-study.mjs";
import { countSentences, scoreCommunicationCompliance } from "./communication-compliance.mjs";

assert(parseJudgeJson('{"answerA":{"accept":true}}')?.answerA.accept === true, "parses plain JSON");
assert(
  parseJudgeJson('Sure, here is my verdict:\n```json\n{"answerA":{"accept":false}}\n```\nLet me know if you need more.')
    ?.answerA.accept === false,
  "extracts JSON from a fenced block wrapped in prose"
);
assert(
  parseJudgeJson('{"nested":{"a":1},"answerA":{"accept":true}}')?.answerA.accept === true,
  "handles nested braces without truncating early"
);
assert(parseJudgeJson("not json at all") === null, "returns null instead of throwing on unparseable text");
assert(parseJudgeJson('{"unterminated": ') === null, "returns null on truncated JSON rather than a partial guess");

await testAggregateAndWrite();

// Communication-compliance scoring. These guard the two ways the proxy can lie:
// counting a rule as broken when the answer did follow it in another notation,
// and counting a rule as followed when the answer never applied it.
const longProse = Array.from({ length: 12 }, (_, i) => `This is body sentence number ${i + 1}.`).join(" ");

assert(scoreCommunicationCompliance("Fact: the build passes.").checks.labelsClaims, "bare label counts");
assert(
  scoreCommunicationCompliance("**Fact (recalled, pre-cutoff):** Node 24 is current.").checks.labelsClaims,
  "a bold, qualified label counts"
);
assert(scoreCommunicationCompliance("`Recommendation:` ship it.").checks.labelsClaims, "a code-span label counts");
assert(
  !scoreCommunicationCompliance("Let us review the facts of the matter and the assumptions people make.").checks
    .labelsClaims,
  "prose about facts and assumptions is not a label"
);
assert(
  scoreCommunicationCompliance("Short answer. Two sentences.").checks.tldrWhenLong === null,
  "a short answer is not required to carry a TL;DR"
);
assert(
  scoreCommunicationCompliance("Short answer. Two sentences.").rulesChecked === 2,
  "an inapplicable rule leaves the denominator"
);
assert(
  scoreCommunicationCompliance(longProse).checks.tldrWhenLong === false,
  "a long answer without the opener fails the TL;DR rule"
);
assert(
  scoreCommunicationCompliance(`TL;DR: it works.\n\n${longProse}`).checks.tldrWhenLong === true,
  "a long answer with the opener passes"
);
assert(
  !scoreCommunicationCompliance("Sure, I can help with that. Here we go.").checks.noPreamble,
  "an opening pleasantry is preamble"
);
assert(
  countSentences("One real sentence.\n```js\nconst a = 1; const b = 2; const c = 3;\n```") === 1,
  "code fences do not inflate the sentence count"
);

console.log("Answer-study tests passed (20 checks).");

async function testAggregateAndWrite() {
  const { aggregate } = await import("./answer-study.mjs");
  const runId = `test-fixture-${process.pid}-${Date.now()}`;
  const dir = new URL(`./assessments/answer-study/${runId}/`, import.meta.url);
  await mkdir(dir, { recursive: true });

  // Two fixture cases with known, hand-computed judge verdicts, including one
  // transcript with baselineIsA=false so the position-to-variant remap is exercised,
  // and one with an unparseable judge response so it is skipped, not miscounted.
  await writeFixture(dir, "case-one", {
    case: "case one",
    task: "do a thing",
    baselineAnswer: "baseline answer text here, six words total",
    candidateAnswer: "candidate answer, shorter",
    baselineIsA: true,
    blindJudgeRaw: '{"answerA":{"accept":true,"hardDefect":false},"answerB":{"accept":true,"hardDefect":false}}',
    strictJudgeRaw: '{"answerA":{"accept":true},"answerB":{"accept":false},"preferred":"A"}',
    model: "test-model",
    judgeModel: "test-model",
  });
  await writeFixture(dir, "case-two", {
    case: "case two",
    task: "do another thing",
    baselineAnswer: "baseline two",
    candidateAnswer: "candidate two is markedly longer than the baseline answer for this case",
    baselineIsA: false,
    blindJudgeRaw: '{"answerA":{"accept":true,"hardDefect":true},"answerB":{"accept":false,"hardDefect":false}}',
    strictJudgeRaw: '{"answerA":{"accept":true},"answerB":{"accept":false},"preferred":"B"}',
    model: "test-model",
    judgeModel: "test-model",
  });
  await writeFixture(dir, "case-three-unparseable", {
    case: "case three",
    task: "do a third thing",
    baselineAnswer: "x",
    candidateAnswer: "y",
    baselineIsA: true,
    blindJudgeRaw: "the judge refused to answer",
    strictJudgeRaw: '{"answerA":{"accept":true},"answerB":{"accept":true},"preferred":"tie"}',
    model: "test-model",
    judgeModel: "test-model",
  });

  try {
    const summary = await aggregate({ runId });
    // Hand-traced against the fixtures above through the position remap in aggregate()'s
    // pick(verdict, isBaseline) = transcript.baselineIsA === isBaseline ? verdict.answerA : verdict.answerB:
    //   case one (baselineIsA=true):  blindBaseline=answerA(accept,noDefect)  blindCandidate=answerB(accept,noDefect)
    //                                 strictBaseline=answerA(accept) strictCandidate=answerB(reject) preferred="A"->baseline
    //   case two (baselineIsA=false): blindBaseline=answerB(reject,noDefect) blindCandidate=answerA(accept,hardDefect)
    //                                 strictBaseline=answerB(reject) strictCandidate=answerA(accept) preferred="B"->baseline
    // Totals: baseline accepted 1/2, candidate accepted 2/2 (blind); 1 hard defect (case two's candidate);
    // both cases prefer baseline, so candidate has 0 wins and 2 losses.
    assert(summary.fields.answerPairs === 2, "unparseable case is excluded from answerPairs");
    assert(summary.parseFailures === 1, "unparseable case is counted as a parse failure");
    assert(summary.fields.blindJudge.baseline === 1, "only case one's baseline answer is accepted by the blind judge");
    assert(summary.fields.blindJudge.candidate === 2, "both candidate answers are accepted by the blind judge");
    assert(summary.fields.blindJudge.hardDefects === 1, "case two's candidate hard defect is counted once");
    assert(summary.fields.strictJudge.baselineAccepted === 1, "strict judge accepts only case one's baseline answer");
    assert(summary.fields.strictJudge.candidateAccepted === 1, "strict judge accepts only case two's candidate answer");
    assert(summary.fields.strictJudge.candidateWins === 0, "both preferences resolve to baseline given the position remap");
    assert(summary.fields.strictJudge.candidateLosses === 2, "candidate lost both head-to-head preferences");
    assert(
      summary.fields.visibleAnswerTokens.baseline > 0 && summary.fields.visibleAnswerTokens.candidate > 0,
      "answer token counts are computed from the transcript text"
    );

    const scratch = await mkdtemp(path.join(tmpdir(), "evaluation-ts-"));
    const evaluationPath = path.join(scratch, "evaluation.ts");
    await writeFile(evaluationPath, await readFile(new URL("./evaluation.ts", import.meta.url), "utf8"), "utf8");
    const before = await readFile(evaluationPath, "utf8");
    await writeEvaluationSnapshot(summary.fields, evaluationPath);
    const after = await readFile(evaluationPath, "utf8");
    assert(after.includes(`answerPairs: ${summary.fields.answerPairs},`), "writes the new answerPairs count");
    assert(after.includes(`baseline: ${summary.fields.blindJudge.baseline},`), "writes the new blindJudge.baseline count");
    assert(
      before.match(/corpus: \{[\s\S]*?policyCases: \d+,/)[0] === after.match(/corpus: \{[\s\S]*?policyCases: \d+,/)[0],
      "does not touch the deterministic corpus.policyCases field it does not own"
    );
    await rm(scratch, { recursive: true, force: true });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function writeFixture(dir, name, fields) {
  await writeFile(new URL(`${name}.json`, dir), JSON.stringify({ language: null, baselineCategories: [], candidateCategories: [], baselineGuidance: "", candidateGuidance: "", generatedAt: new Date().toISOString(), ...fields }, null, 2), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(`Answer-study test failed: ${message}`);
}
