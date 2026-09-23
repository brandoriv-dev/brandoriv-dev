// A deterministic proxy for whether an answer actually followed the communication
// policy, as opposed to whether the policy text was delivered. mcp:policy-eval
// checks delivery (is the rule present in the payload); this checks observance
// (did the produced answer obey it). It runs over answer-study transcripts that
// are already retained on disk, so it costs no provider usage and is exact.
//
// It is a regex proxy and nothing more. It cannot tell whether a label is
// honest, whether the lead sentence is the right answer, or whether the writing
// is good. It measures the three mechanical rules the policy states outright,
// and a rule it cannot observe is reported as not applicable rather than passed.
const PREAMBLE =
  /^(sure|certainly|absolutely|of course|great question|good question|happy to|let me\b|i'll\b|i will\b|i'd be\b|in this (answer|response)|here'?s? (is )?(a|an|the|my)\b)/i;
// Labels appear wrapped in markdown emphasis far more often than bare, and a
// qualified label ("Fact (recalled, pre-cutoff):") is still a label, so both
// forms count. Anything looser starts matching ordinary prose about facts.
const LABEL =
  /(?:^|[\s(>])[*_`]{0,2}(?:Fact|Inference|Assumption|Recommendation)[*_`]{0,2}(?:\s*\([^)\n]{1,60}\))?[*_`]{0,2}\s*:/m;
const TLDR = /^\s*(?:#{1,6}\s*)?(?:\*\*)?TL;DR:?/i;

// Past this many sentences the policy requires a TL;DR opener.
export const LONG_ANSWER_SENTENCES = 6;

export const complianceRules = ["noPreamble", "labelsClaims", "tldrWhenLong"];

export function countSentences(text) {
  const prose = String(text)
    // Fenced code is not prose; a semicolon-heavy snippet would otherwise read as
    // dozens of sentences and force a TL;DR the policy never asked for.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ");
  return (prose.match(/[.!?](?:\s|$)/g) ?? []).length;
}

export function scoreCommunicationCompliance(answer) {
  const text = String(answer ?? "").trim();
  const firstLine = text.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
  const sentences = countSentences(text);
  const isLong = sentences > LONG_ANSWER_SENTENCES;

  const checks = {
    noPreamble: !PREAMBLE.test(firstLine),
    labelsClaims: LABEL.test(text),
    // Not applicable to a short answer: the policy only requires the opener past
    // roughly six sentences, so a compliant short answer must not be penalized.
    tldrWhenLong: isLong ? TLDR.test(text) : null,
  };

  const applicable = complianceRules.filter((rule) => checks[rule] !== null);
  return {
    sentences,
    checks,
    rulesChecked: applicable.length,
    rulesMet: applicable.filter((rule) => checks[rule]).length,
  };
}

export function summarizeCompliance(scores) {
  return scores.reduce(
    (totals, score) => ({ met: totals.met + score.rulesMet, checked: totals.checked + score.rulesChecked }),
    { met: 0, checked: 0 }
  );
}
