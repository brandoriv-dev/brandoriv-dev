import { candidateFamilies } from "./options-data.js";
import { normalizeChoiceMap, parseChoiceSnapshot, serializeChoiceSnapshot } from "./options-state.js";

const root = document.documentElement;
const container = document.querySelector("#candidate-families");
const progress = document.querySelector("[data-selection-progress]");
const hint = document.querySelector("[data-selection-hint]");
const output = document.querySelector("[data-selection-output]");
const copyButton = document.querySelector("[data-copy-selections]");
const copyStatus = document.querySelector("[data-copy-status]");
const clearButton = document.querySelector("[data-clear-selections]");
const nextButton = document.querySelector("[data-next-undecided]");
const jumpSelect = document.querySelector("[data-candidate-jump]");
const themeButton = document.querySelector("#theme");
const storageKey = "moss-candidate-choices-v1";
const catalogPreferenceKey = "moss-catalog-preferences";
const tierIds = { Primitives: "primitives", Structures: "structures", Layouts: "layouts" };
const familyIds = candidateFamilies.map((family) => family.id);
const validIds = new Set(familyIds);

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  }
};

const readJson = (value, fallback = {}) => {
  try { return JSON.parse(value || "") ?? fallback; } catch { return fallback; }
};

const storedChoices = normalizeChoiceMap(readJson(storage.get(storageKey)), validIds);
const urlChoices = parseChoiceSnapshot(location.search, validIds);
const choices = { ...(urlChoices ?? storedChoices) };

const makeApplicability = (family) => {
  const list = document.createElement("dl");
  for (const [term, description] of [["Use when", family.use], ["Avoid when", family.avoid], ["Mobile", family.mobile]]) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = description;
    row.append(dt, dd);
    list.append(row);
  }
  return list;
};

const makeOption = (family, option, number) => {
  const optionId = `candidate-${family.id}-${option.key.toLowerCase()}`;
  const label = document.createElement("label");
  label.className = "candidate-option" + (option.key === "P" ? " candidate-option--product-owned" : "");
  label.dataset.option = option.key;

  const radio = document.createElement("input");
  radio.id = optionId;
  radio.type = "radio";
  radio.name = family.id;
  radio.value = option.key;
  radio.checked = choices[family.id] === option.key;

  const header = document.createElement("span");
  header.className = "candidate-option__header";
  const key = document.createElement("b");
  key.textContent = option.key;
  const title = document.createElement("span");
  const name = document.createElement("strong");
  const tradeoff = document.createElement("small");
  name.id = `${optionId}-title`;
  tradeoff.id = `${optionId}-tradeoff`;
  name.textContent = option.title;
  tradeoff.textContent = option.tradeoff;
  title.append(name, tradeoff);
  header.append(key, title);

  const preview = document.createElement("span");
  preview.className = "candidate-preview";
  preview.dataset.family = family.id;
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = option.preview;

  const facts = document.createElement("span");
  facts.className = "candidate-option__facts";
  const keyboard = document.createElement("span");
  const states = document.createElement("span");
  keyboard.innerHTML = `<b>Keyboard</b><small></small>`;
  states.innerHTML = `<b>State burden</b><small></small>`;
  const keyboardCopy = keyboard.querySelector("small");
  const stateCopy = states.querySelector("small");
  keyboardCopy.id = `${optionId}-keyboard`;
  stateCopy.id = `${optionId}-states`;
  keyboardCopy.textContent = option.keyboard;
  stateCopy.textContent = option.states;
  facts.append(keyboard, states);
  radio.setAttribute("aria-labelledby", name.id);
  radio.setAttribute("aria-describedby", `${tradeoff.id} ${keyboardCopy.id} ${stateCopy.id}`);

  const select = document.createElement("span");
  select.className = "candidate-option__select";
  select.textContent = `${option.key === "P" ? "Reviewed" : "Build first"} / ${String(number).padStart(2, "0")}${option.key}`;
  label.append(radio, header);
  if (option.preview) label.append(preview, facts);
  else radio.setAttribute("aria-describedby", tradeoff.id);
  label.append(select);
  return label;
};

const makeDecisionActions = (family) => {
  const actions = document.createElement("div");
  actions.className = "candidate-family__actions";
  const reset = document.createElement("button");
  reset.type = "button";
  reset.dataset.clearFamily = family.id;
  reset.textContent = "Reset to undecided";
  actions.append(reset);
  return actions;
};

const renderFamilies = () => {
  let currentTier = "";
  let tierSection;
  candidateFamilies.forEach((family, index) => {
    if (family.tier !== currentTier) {
      currentTier = family.tier;
      tierSection = document.createElement("section");
      tierSection.className = "candidate-tier";
      tierSection.id = tierIds[currentTier];
      const header = document.createElement("header");
      const eyebrow = document.createElement("p");
      const heading = document.createElement("h2");
      const copy = document.createElement("p");
      eyebrow.className = "moss-eyebrow";
      eyebrow.textContent = `Tier ${Object.keys(tierIds).indexOf(currentTier) + 1}`;
      heading.textContent = currentTier;
      copy.textContent = currentTier === "Primitives" ? "Small contracts with large semantic consequences." : currentTier === "Structures" ? "Reusable interaction and information arrangements." : "Task-specific compositions that test the system at page scale.";
      header.append(eyebrow, heading, copy);
      tierSection.append(header);
      container.append(tierSection);
    }

    const section = document.createElement("section");
    section.className = "candidate-family";
    section.id = family.id;
    section.dataset.candidateFamily = family.id;
    section.tabIndex = -1;

    const familyHeader = document.createElement("header");
    const number = document.createElement("span");
    const copy = document.createElement("div");
    const meta = document.createElement("p");
    const title = document.createElement("h3");
    const question = document.createElement("strong");
    const context = document.createElement("p");
    number.className = "candidate-family__number";
    number.textContent = String(index + 1).padStart(2, "0");
    meta.className = "moss-eyebrow";
    meta.textContent = `${family.tier} / candidate`;
    title.textContent = family.title;
    title.id = `${family.id}-title`;
    section.setAttribute("aria-labelledby", title.id);
    question.textContent = `${family.question} Choose what Moss should prove first.`;
    context.textContent = family.context;
    copy.append(meta, title, question, context, makeApplicability(family));
    familyHeader.append(number, copy);

    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const options = document.createElement("div");
    legend.className = "moss-visually-hidden";
    legend.textContent = `Choose the first direction to prove for ${family.title}`;
    options.className = "candidate-options";
    family.options.forEach((option) => options.append(makeOption(family, option, index + 1)));
    options.append(makeOption(family, { key: "P", title: "Keep product-owned / defer", tradeoff: "Do not force a shared abstraction until another product proves the recurring contract." }, index + 1));
    fieldset.append(legend, options);
    section.append(familyHeader, fieldset, makeDecisionActions(family));
    tierSection.append(section);

    const jump = document.createElement("option");
    jump.value = family.id;
    jump.textContent = `${String(index + 1).padStart(2, "0")} / ${family.title}`;
    jumpSelect.append(jump);
  });
};

const compactChoices = () => candidateFamilies.flatMap((family, index) => choices[family.id] ? [`${String(index + 1).padStart(2, "0")}${choices[family.id]}`] : []);

const syncChoiceControls = () => {
  for (const family of candidateFamilies) {
    const isProductOwned = choices[family.id] === "P";
    document.querySelector(`[data-candidate-family="${family.id}"]`)?.toggleAttribute("data-product-owned", isProductOwned);
  }
};

const syncChoices = ({ persist = false, updateUrl = false } = {}) => {
  const selected = compactChoices();
  const count = selected.length;
  progress.textContent = `${count} of ${candidateFamilies.length}`;
  output.textContent = count ? selected.join(" ") : "No decisions reviewed";
  copyButton.disabled = count === 0;
  nextButton.disabled = count === candidateFamilies.length;
  hint.textContent = count === candidateFamilies.length ? "Decision round complete. Copy the brief and send it back for implementation." : `${candidateFamilies.length - count} decisions remain; blank means not reviewed.`;
  syncChoiceControls();
  if (persist) storage.set(storageKey, JSON.stringify(choices));
  if (updateUrl) {
    const url = new URL(location.href);
    const encoded = serializeChoiceSnapshot(choices, familyIds);
    if (encoded) url.searchParams.set("choices", encoded);
    else url.searchParams.delete("choices");
    history.replaceState(null, "", url);
  }
};

const copyChoices = async () => {
  const rows = candidateFamilies.flatMap((family, index) => {
    const value = choices[family.id];
    if (!value) return [];
    const direction = value === "P" ? "Keep product-owned / defer" : family.options.find((item) => item.key === value)?.title;
    return [`${String(index + 1).padStart(2, "0")}${value} - ${family.title}: ${direction}`];
  });
  const brief = `Moss candidate choices\n${compactChoices().join(" ")}\n\n${rows.join("\n")}\n\nJSON\n${JSON.stringify(choices, null, 2)}`;
  let copied = false;
  try {
    await navigator.clipboard.writeText(brief);
    copied = true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = brief;
    textarea.setAttribute("aria-label", "Candidate brief fallback");
    document.body.append(textarea);
    textarea.select();
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    textarea.remove();
  }
  copyButton.textContent = copied ? "Copied" : "Copy unavailable";
  copyStatus.textContent = copied ? "Candidate choices copied." : "Clipboard access failed. The compact codes remain visible in Your brief.";
  setTimeout(() => { copyButton.textContent = "Copy choices"; }, 1800);
};

const setFamilyOutcome = (id, outcome) => {
  if (outcome) choices[id] = outcome;
  else delete choices[id];
  document.querySelectorAll(`input[name="${CSS.escape(id)}"]`).forEach((input) => { input.checked = outcome === input.value; });
  syncChoices({ persist: true, updateUrl: true });
};

renderFamilies();
requestAnimationFrame(() => {
  const target = location.hash ? document.querySelector(location.hash) : null;
  target?.scrollIntoView({ block: "start" });
});
container.addEventListener("change", (event) => {
  const input = event.target.closest('input[type="radio"]');
  if (input) setFamilyOutcome(input.name, input.value);
});
container.addEventListener("click", (event) => {
  const reset = event.target.closest("[data-clear-family]");
  if (reset) setFamilyOutcome(reset.dataset.clearFamily, null);
});
clearButton.addEventListener("click", () => {
  if (!Object.keys(choices).length || !window.confirm("Clear every candidate decision? This cannot be undone.")) return;
  for (const key of Object.keys(choices)) delete choices[key];
  document.querySelectorAll('.candidate-option input[type="radio"]').forEach((input) => { input.checked = false; });
  syncChoices({ persist: true, updateUrl: true });
});
nextButton.addEventListener("click", () => {
  const next = candidateFamilies.find((family) => !choices[family.id]);
  if (!next) return;
  const section = document.getElementById(next.id);
  section?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  section?.focus({ preventScroll: true });
});
jumpSelect.addEventListener("change", () => {
  const section = document.getElementById(jumpSelect.value);
  section?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  section?.focus({ preventScroll: true });
});
copyButton.addEventListener("click", copyChoices);

const catalogPreferences = readJson(storage.get(catalogPreferenceKey));
let mode = catalogPreferences.mode === "light" ? "light" : "dark";
const applyMode = ({ persist = false } = {}) => {
  root.dataset.mossTheme = mode;
  themeButton.setAttribute("aria-pressed", String(mode === "dark"));
  themeButton.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`);
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--moss-canvas").trim();
  if (persist) storage.set(catalogPreferenceKey, JSON.stringify({ ...catalogPreferences, mode }));
};
themeButton.addEventListener("click", () => {
  mode = mode === "dark" ? "light" : "dark";
  applyMode({ persist: true });
});
applyMode();
syncChoices();
