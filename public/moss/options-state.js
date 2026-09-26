export const CANDIDATE_OUTCOMES = new Set(["A", "B", "C", "P"]);

export function normalizeChoiceMap(value, validIds) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const choices = {};
  for (const [id, outcome] of Object.entries(value)) {
    if (validIds.has(id) && CANDIDATE_OUTCOMES.has(outcome)) choices[id] = outcome;
  }
  return choices;
}

export function parseChoiceSnapshot(search, validIds) {
  const encoded = new URLSearchParams(search).get("choices");
  if (!encoded) return null;
  const choices = {};
  for (const entry of encoded.split(",")) {
    const parts = entry.split(":");
    if (parts.length !== 2) return null;
    const [id, outcome] = parts;
    if (!validIds.has(id) || !CANDIDATE_OUTCOMES.has(outcome) || choices[id]) return null;
    choices[id] = outcome;
  }
  return Object.keys(choices).length ? choices : null;
}

export function serializeChoiceSnapshot(choices, orderedIds) {
  return orderedIds.flatMap((id) => CANDIDATE_OUTCOMES.has(choices[id]) ? [`${id}:${choices[id]}`] : []).join(",");
}
