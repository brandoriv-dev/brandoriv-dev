// The model-answer quality study that mcp:policy-eval deliberately does not
// attempt. That suite is deterministic and reproducible offline (regex presence
// and byte counts); this one calls a live model to generate real answers under
// the baseline and candidate policy, then scores them with two independent
// judge passes. It costs real provider usage and its output is not bit-for-bit
// reproducible (model sampling varies run to run), so it is not part of the
// deterministic mcp:policy-eval gate and does not run on every commit.
//
// Two modes:
//
//   ANTHROPIC_API_KEY=... bun run mcp:answer-study -- --write
//     Calls the Anthropic Messages API for every case, retains the full
//     transcript of each call under mcp/assessments/answer-study/<runId>/,
//     aggregates the result, and (with --write) patches the five
//     answer-study-owned fields in evaluation.ts in place.
//
//   bun run mcp:answer-study -- --aggregate <runId> --write
//     Re-aggregates an already-retained run without calling the API again.
//     Used to apply a run whose transcripts were produced some other way (for
//     example, this project's own coding agent standing in for the API during
//     a session with no ANTHROPIC_API_KEY configured) through the exact same
//     scoring code a live run uses, so the two paths cannot silently diverge.
//
// Env:
//   ANSWER_STUDY_MODEL         default claude-sonnet-5
//   ANSWER_STUDY_JUDGE_MODEL   default same as ANSWER_STUDY_MODEL
//   ANSWER_STUDY_CASES         how many corpus cases to run, from the front of
//                              the shared corpus in mcp/corpus.mjs, so two runs
//                              at the same count compare the same tasks.
//                              Default: the full corpus.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { countTokens } from "gpt-tokenizer";
import { complianceRules, scoreCommunicationCompliance, summarizeCompliance } from "./communication-compliance.mjs";
import { cases as fullCorpus, formatGuidance, percentChange, wordCount } from "./corpus.mjs";
import { baselinePolicies, selectBaselineCategoryIds } from "./policy-baseline.mjs";
import { categoryDefinitions, selectRelevantCategoryIds } from "./routing.ts";

const ANSWER_INSTRUCTION =
  "There is no real repository attached to this request; answer as completely as the task allows without one. " +
  "Write the actual response you would give a developer for this task now: concrete guidance, code, or analysis " +
  "as the task calls for. Do not ask a clarifying question and do not describe a plan to answer later. Keep the " +
  "answer under 500 words.";

const BLIND_JUDGE_SYSTEM =
  "You are a blind quality judge comparing two AI coding agents' answers to the same task. You do not know which " +
  "agent produced which answer, and you must not guess. Judge each answer independently against the task, using " +
  "ordinary professional judgment. A hard defect is a confidently stated wrong fact, code presented as correct " +
  "that would not run or compile, or unsafe/harmful advice. Respond with only the requested JSON, no other text.";

const STRICT_JUDGE_SYSTEM =
  "You are a strict acceptance judge comparing two AI coding agents' answers to the same task. Accept an answer " +
  "only if it is complete and directly actionable with no further clarification needed from the user, correctly " +
  "scoped to the task, and free of hedging or filler. Independently of accept/reject, state which answer you " +
  "would personally choose to follow. Respond with only the requested JSON, no other text.";

export async function main(argv = process.argv.slice(2)) {
  const shouldWrite = argv.includes("--write");
  const aggregateIndex = argv.indexOf("--aggregate");
  const model = process.env.ANSWER_STUDY_MODEL || "claude-sonnet-5";
  const judgeModel = process.env.ANSWER_STUDY_JUDGE_MODEL || model;

  const currentPolicies = Object.fromEntries(
    await Promise.all(
      categoryDefinitions.map(async ({ id }) => [
        id,
        (await readFile(new URL(`./preferences/${id}.md`, import.meta.url), "utf8")).trim(),
      ])
    )
  );

  let runId;
  if (aggregateIndex !== -1) {
    runId = argv[aggregateIndex + 1];
    if (!runId) throw new Error("--aggregate needs a run id, e.g. --aggregate 2026-09-21T00-00-00-000Z");
  } else {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(
        "Set ANTHROPIC_API_KEY to run the answer study live, or pass --aggregate <runId> to re-score an " +
          "already-retained run under mcp/assessments/answer-study/."
      );
      process.exitCode = 1;
      return;
    }
    const caseLimit = Number(process.env.ANSWER_STUDY_CASES || fullCorpus.length);
    const selectedCases = fullCorpus.slice(0, Math.max(1, Math.min(caseLimit, fullCorpus.length)));
    runId = new Date().toISOString().replace(/[:.]/g, "-");
    await runLive({ apiKey, model, judgeModel, selectedCases, currentPolicies, runId });
  }

  const report = await aggregate({ runId, currentPolicies });
  console.log(JSON.stringify(report, null, 2));

  if (shouldWrite) {
    await writeEvaluationSnapshot(report.fields);
    console.log(`\nWrote mcp/evaluation.ts from run ${runId} (${report.fields.answerPairs} case${report.fields.answerPairs === 1 ? "" : "s"}).`);
  }
  return report;
}

async function runLive({ apiKey, model, judgeModel, selectedCases, currentPolicies, runId }) {
  const dir = new URL(`./assessments/answer-study/${runId}/`, import.meta.url);
  await mkdir(dir, { recursive: true });

  for (const testCase of selectedCases) {
    const baselineCategories = selectBaselineCategoryIds(testCase.input);
    const candidateCategories = selectRelevantCategoryIds(testCase.input);
    const baselineGuidance = formatGuidance(baselineCategories, baselinePolicies);
    const candidateGuidance = formatGuidance(candidateCategories, currentPolicies);

    const baselineAnswer = await callModel(apiKey, model, answerSystemPrompt(baselineGuidance), taskUserMessage(testCase));
    const candidateAnswer = await callModel(apiKey, model, answerSystemPrompt(candidateGuidance), taskUserMessage(testCase));

    // Randomize which transcript position is "A" so a judge cannot infer identity from order.
    const baselineIsA = Math.random() < 0.5;
    const [answerA, answerB] = baselineIsA ? [baselineAnswer, candidateAnswer] : [candidateAnswer, baselineAnswer];

    const blindJudgeRaw = await callModel(apiKey, judgeModel, BLIND_JUDGE_SYSTEM, blindJudgePrompt(testCase, answerA, answerB));
    const strictJudgeRaw = await callModel(apiKey, judgeModel, STRICT_JUDGE_SYSTEM, strictJudgePrompt(testCase, answerA, answerB));

    await writeTranscript(dir, testCase.name, {
      case: testCase.name,
      task: testCase.input.task,
      language: testCase.input.language ?? null,
      baselineCategories,
      candidateCategories,
      baselineGuidance,
      candidateGuidance,
      baselineAnswer,
      candidateAnswer,
      baselineIsA,
      blindJudgeRaw,
      strictJudgeRaw,
      model,
      judgeModel,
      generatedAt: new Date().toISOString(),
    });
  }
}

export async function aggregate({ runId }) {
  const dir = new URL(`./assessments/answer-study/${runId}/`, import.meta.url);
  const files = (await readdir(dir)).filter((name) => name.endsWith(".json") && name !== "summary.json").sort();
  if (files.length === 0) throw new Error(`No transcripts found under mcp/assessments/answer-study/${runId}/`);

  const totals = {
    answerPairs: 0,
    baselineTokens: 0,
    candidateTokens: 0,
    baselineWords: 0,
    candidateWords: 0,
    blindBaselineAccept: 0,
    blindCandidateAccept: 0,
    hardDefects: 0,
    strictBaselineAccept: 0,
    strictCandidateAccept: 0,
    candidateWins: 0,
    candidateLosses: 0,
    ties: 0,
  };
  const baselineCompliance = [];
  const candidateCompliance = [];
  const cases = [];
  let model = null;
  let judgeModel = null;
  let parseFailures = 0;

  for (const file of files) {
    const transcript = JSON.parse(await readFile(new URL(file, dir), "utf8"));
    model = model || transcript.model;
    judgeModel = judgeModel || transcript.judgeModel;

    const baselineTokens = countTokens(transcript.baselineAnswer);
    const candidateTokens = countTokens(transcript.candidateAnswer);
    const baselineWords = wordCount(transcript.baselineAnswer);
    const candidateWords = wordCount(transcript.candidateAnswer);

    const blind = parseJudgeJson(transcript.blindJudgeRaw);
    const strict = parseJudgeJson(transcript.strictJudgeRaw);
    if (!blind || !strict) {
      parseFailures += 1;
      cases.push({ case: transcript.case, skipped: true, reason: "judge response was not parseable JSON" });
      continue;
    }

    const pick = (verdict, isBaseline) => (transcript.baselineIsA === isBaseline ? verdict.answerA : verdict.answerB);
    const blindBaseline = pick(blind, true);
    const blindCandidate = pick(blind, false);
    const strictBaseline = pick(strict, true);
    const strictCandidate = pick(strict, false);
    // The judge names a transcript position ("A"/"B"); map that back to baseline/candidate.
    const preferredIsA = strict.preferred === "A";
    const preferredIsB = strict.preferred === "B";
    const preferred = !preferredIsA && !preferredIsB
      ? "tie"
      : preferredIsA === transcript.baselineIsA
        ? "baseline"
        : "candidate";

    totals.answerPairs += 1;
    totals.baselineTokens += baselineTokens;
    totals.candidateTokens += candidateTokens;
    totals.baselineWords += baselineWords;
    totals.candidateWords += candidateWords;
    if (blindBaseline?.accept) totals.blindBaselineAccept += 1;
    if (blindCandidate?.accept) totals.blindCandidateAccept += 1;
    if (blindBaseline?.hardDefect) totals.hardDefects += 1;
    if (blindCandidate?.hardDefect) totals.hardDefects += 1;
    if (strictBaseline?.accept) totals.strictBaselineAccept += 1;
    if (strictCandidate?.accept) totals.strictCandidateAccept += 1;
    if (preferred === "candidate") totals.candidateWins += 1;
    else if (preferred === "baseline") totals.candidateLosses += 1;
    else totals.ties += 1;

    const baselineObserved = scoreCommunicationCompliance(transcript.baselineAnswer);
    const candidateObserved = scoreCommunicationCompliance(transcript.candidateAnswer);
    baselineCompliance.push(baselineObserved);
    candidateCompliance.push(candidateObserved);

    cases.push({
      case: transcript.case,
      baselineTokens,
      candidateTokens,
      blindBaseline,
      blindCandidate,
      strictBaseline,
      strictCandidate,
      preferred,
      communicationCompliance: { baseline: baselineObserved, candidate: candidateObserved },
    });
  }

  const runCases = totals.answerPairs;
  const baselineObeyed = summarizeCompliance(baselineCompliance);
  const candidateObeyed = summarizeCompliance(candidateCompliance);
  const fields = {
    answerPairs: runCases,
    communicationCompliance: {
      baseline: baselineObeyed.met,
      candidate: candidateObeyed.met,
      baselinePossible: baselineObeyed.checked,
      candidatePossible: candidateObeyed.checked,
      rules: complianceRules.length,
      scope:
        "Deterministic regex observance of the stated communication rules in the retained answers, not a quality judgment. Rules that do not apply to an answer are excluded from its denominator.",
    },
    visibleAnswerTokens: {
      baseline: totals.baselineTokens,
      candidate: totals.candidateTokens,
      changePercent: percentChange(totals.baselineTokens, totals.candidateTokens),
    },
    visibleAnswerWords: {
      baseline: totals.baselineWords,
      candidate: totals.candidateWords,
      changePercent: percentChange(totals.baselineWords, totals.candidateWords),
    },
    blindJudge: {
      baseline: totals.blindBaselineAccept,
      candidate: totals.blindCandidateAccept,
      possible: runCases,
      hardDefects: totals.hardDefects,
    },
    strictJudge: {
      baselineAccepted: totals.strictBaselineAccept,
      candidateAccepted: totals.strictCandidateAccept,
      possible: runCases,
      candidateWins: totals.candidateWins,
      candidateLosses: totals.candidateLosses,
      ties: totals.ties,
    },
    modelAnswerSample: {
      reproducible: true,
      runsPerVariant: 1,
      sourceArtifactsRetained: true,
      label: `${runCases}-case model-answer sample vs the frozen baseline (${model || "unknown model"}, one run per variant; bun run mcp:answer-study -- --aggregate ${runId} to re-score the retained transcripts).`,
    },
  };

  const summary = { runId, model, judgeModel, caseCount: files.length, parseFailures, cases, fields };
  await writeFile(new URL("summary.json", dir), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return summary;
}

function answerSystemPrompt(guidance) {
  return `You are an AI coding agent. The following are your working preferences for this task; follow them.\n\n${guidance}`;
}

function taskUserMessage(testCase) {
  const parts = [testCase.input.task];
  if (testCase.input.language) parts.push(`Primary language: ${testCase.input.language}`);
  parts.push(`\n${ANSWER_INSTRUCTION}`);
  return parts.join("\n");
}

function blindJudgePrompt(testCase, answerA, answerB) {
  return [
    `Task given to two AI coding agents:\n"""\n${testCase.input.task}\n"""`,
    `Answer A:\n"""\n${answerA}\n"""`,
    `Answer B:\n"""\n${answerB}\n"""`,
    'Respond with ONLY this JSON object, no other text:\n{"answerA":{"accept":true|false,"hardDefect":true|false},"answerB":{"accept":true|false,"hardDefect":true|false}}',
  ].join("\n\n");
}

function strictJudgePrompt(testCase, answerA, answerB) {
  return [
    `Task given to two AI coding agents:\n"""\n${testCase.input.task}\n"""`,
    `Answer A:\n"""\n${answerA}\n"""`,
    `Answer B:\n"""\n${answerB}\n"""`,
    'Respond with ONLY this JSON object, no other text:\n{"answerA":{"accept":true|false},"answerB":{"accept":true|false},"preferred":"A"|"B"|"tie"}',
  ].join("\n\n");
}

async function callModel(apiKey, model, system, userText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API returned HTTP ${response.status} for model ${model}: ${(await response.text()).slice(0, 500)}`);
  }
  const payload = await response.json();
  return payload.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

// Judge responses are asked to be JSON-only but are free text from a model; take
// the first balanced {...} object in the response rather than trusting the whole
// string to parse, and return null (never a fabricated verdict) if none is found.
export function parseJudgeJson(raw) {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < raw.length; i += 1) {
    if (raw[i] === "{") depth += 1;
    else if (raw[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function writeTranscript(dir, caseName, transcript) {
  const fileName = `${caseName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
  await writeFile(new URL(fileName, dir), `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
}

// Rewrites only the five answer-study-owned fields in evaluation.ts, leaving the
// deterministic fields owned by mcp:policy-eval untouched. Each replacement is
// asserted to match exactly once so a shape change in evaluation.ts fails loudly
// here instead of silently no-op'ing.
export async function writeEvaluationSnapshot(fields, path = new URL("./evaluation.ts", import.meta.url)) {
  let text = await readFile(path, "utf8");

  text = replaceOnce(text, /evaluatedAt: "[^"]*",/, `evaluatedAt: "${new Date().toISOString().slice(0, 10)}",`, "evaluatedAt");
  text = replaceOnce(text, /answerPairs: \d+,/, `answerPairs: ${fields.answerPairs},`, "corpus.answerPairs");
  text = replaceObjectField(text, "communicationCompliance", fields.communicationCompliance);
  text = replaceObjectField(text, "visibleAnswerTokens", fields.visibleAnswerTokens);
  text = replaceObjectField(text, "visibleAnswerWords", fields.visibleAnswerWords);
  text = replaceObjectField(text, "blindJudge", fields.blindJudge);
  text = replaceObjectField(text, "strictJudge", fields.strictJudge);
  text = replaceObjectField(text, "modelAnswerSample", fields.modelAnswerSample, "    ");

  await writeFile(path, text, "utf8");
}

function replaceObjectField(text, name, obj, indent = "  ") {
  const lines = Object.entries(obj).map(([key, value]) => `${indent}  ${key}: ${typeof value === "string" ? JSON.stringify(value) : value},`);
  const replacement = `${indent}${name}: {\n${lines.join("\n")}\n${indent}},`;
  return replaceOnce(text, new RegExp(`${indent}${name}: \\{[^{}]*\\},`), replacement, name);
}

function replaceOnce(text, pattern, replacement, label) {
  const matches = text.match(new RegExp(pattern, "g"));
  if (!matches || matches.length !== 1) {
    throw new Error(`Expected exactly one match for ${label} in evaluation.ts, found ${matches ? matches.length : 0}`);
  }
  return text.replace(pattern, replacement);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
