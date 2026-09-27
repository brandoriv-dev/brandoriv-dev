import { createMossTheme } from "/moss/src/theme.js";
import { shadcnTheme } from "/moss/src/presets/shadcn.js";
import "/moss/src/charts.js";
import { frogThemes } from "./themes.js";

const productThemes = { neutral: shadcnTheme, ...frogThemes };
const root = document.documentElement;
const theme = document.querySelector("#theme");
const character = document.querySelector("#character");
const currentTheme = document.querySelector("[data-theme-current]");
const themeComparison = document.querySelector("[data-theme-comparison]");
const themeValues = document.querySelector("[data-theme-values]");
const preferenceKey = "moss-catalog-preferences";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(preferenceKey) || "{}"); } catch { saved = {}; }
if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};
let mode = saved.mode === "dark" ? "dark" : "light";
character.value = Object.hasOwn(productThemes, saved.character) ? saved.character : "neutral";

const themeEntries = Object.entries(productThemes);
const comparisonRows = [
  ["Default density", (value) => value.density],
  ["Primary", (value) => value.palette[mode].primary, "color"],
  ["Secondary", (value) => value.palette[mode].secondary, "color"],
  ["Typeface", (value) => value.typography.sans.split(",")[0].replaceAll('"', "")],
  ["Type scale", (value) => value.typography.scale],
  ["Sharpness", (value) => value.geometry.sharpness],
  ["Section rhythm", (value) => value.spacing.section],
  ["Raised elevation", (value) => value.elevation.raised],
  ["Motion", (value) => value.motion.normal],
  ["Focus ring", (value) => `${value.interaction.focusWidth} / ${value.interaction.focusOpacity}`],
  ["Rail", (value) => `${value.layout.railExpanded} / ${value.layout.railCollapsed}`],
  ["Chart", (value) => `${value.charts.strokeWidth}px / ${value.charts.barRadius} bars`]
];

const buildThemeDocumentation = () => {
  const table = document.createElement("table");
  table.className = "moss-table";
  const head = table.createTHead().insertRow();
  ["Dial", ...themeEntries.map(([, value]) => value.name)].forEach((label) => {
    const cell = document.createElement("th"); cell.textContent = label; head.append(cell);
  });
  const body = table.createTBody();
  for (const [label, read, kind] of comparisonRows) {
    const row = body.insertRow();
    row.insertCell().textContent = label;
    for (const [, value] of themeEntries) {
      const cell = row.insertCell();
      const result = String(read(value));
      if (kind === "color") { const token = document.createElement("span"); token.className = "theme-value-color"; token.style.setProperty("--value-color", result); token.textContent = result; cell.append(token); }
      else { cell.textContent = result; }
    }
  }
  themeComparison.replaceChildren(table);

  themeValues.replaceChildren();
  for (const [key, value] of themeEntries) {
    const disclosure = document.createElement("moss-disclosure");
    disclosure.dataset.themeValues = key;
    const trigger = document.createElement("button");
    const label = document.createElement("strong"); label.textContent = value.name;
    const hint = document.createElement("small"); hint.textContent = "Complete MossTheme values";
    const copy = document.createElement("span"); copy.append(label, hint);
    const icon = document.createElement("moss-icon"); icon.setAttribute("name", "chevron-down");
    trigger.append(copy, icon);
    const panel = document.createElement("div"); panel.dataset.panel = ""; panel.hidden = true;
    const pre = document.createElement("pre"); pre.textContent = JSON.stringify(value, null, 2); panel.append(pre);
    disclosure.append(trigger, panel); themeValues.append(disclosure);
  }
};

const updateThemeDocumentation = (key) => {
  const value = productThemes[key];
  currentTheme.replaceChildren();
  const copy = document.createElement("div");
  const heading = document.createElement("h3"); heading.textContent = value.name;
  const description = document.createElement("p"); description.textContent = `${value.density} density, ${value.geometry.sharpness} sharpness, ${value.typography.scale} type scale`;
  copy.append(heading, description);
  const swatches = document.createElement("div"); swatches.className = "theme-swatches"; swatches.setAttribute("aria-label", "Primary, secondary, and data colors");
  [value.palette[mode].primary, value.palette[mode].secondary, ...value.palette.data].forEach((color) => { const swatch = document.createElement("span"); swatch.className = "theme-swatch"; swatch.style.setProperty("--swatch", color); swatch.title = color; swatches.append(swatch); });
  currentTheme.append(copy, swatches);
  document.querySelectorAll("[data-theme-values]").forEach((item) => item.toggleAttribute("data-current", item.dataset.themeValues === key));
};

const foundationCharacter = document.querySelector("#foundation-character");
foundationCharacter.replaceChildren(...[...character.options].map((option) => option.cloneNode(true)));

const applyTheme = () => {
  const selected = createMossTheme({ ...productThemes[character.value], mode });
  if (character.value === "neutral") root.dataset.mossStyle = "shadcn";
  else root.removeAttribute("data-moss-style");
  selected.apply(root);
  foundationCharacter.value = character.value;
  document.querySelector('meta[name="theme-color"]').content = selected.toVariables(mode, selected.density)["--moss-canvas"];
  try { localStorage.setItem(preferenceKey, JSON.stringify({ ...saved, character: character.value, mode })); } catch { /* preferences are optional */ }
  buildThemeDocumentation();
  updateThemeDocumentation(character.value);
};

character.addEventListener("change", applyTheme);
foundationCharacter.addEventListener("change", () => { character.value = foundationCharacter.value; applyTheme(); });
theme.addEventListener("click", () => {
  mode = mode === "light" ? "dark" : "light";
  applyTheme();
  theme.setAttribute("aria-pressed", String(mode === "dark"));
  theme.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`);
});
theme.setAttribute("aria-pressed", String(mode === "dark"));
theme.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`);
applyTheme();

const toast = (message, tone = "info") => window.dispatchEvent(new CustomEvent("moss-toast", { detail: { message, tone } }));
document.querySelector("#runReport").addEventListener("click", (event) => {
  event.currentTarget.setAttribute("aria-busy", "true");
  event.currentTarget.textContent = "Running...";
  const button = event.currentTarget;
  setTimeout(() => { button.removeAttribute("aria-busy"); button.textContent = "Run report"; toast("Demo report is ready"); }, 900);
});
document.querySelector("#showToast").addEventListener("click", () => toast("Workspace is already quiet"));

const sections = [...document.querySelectorAll(".catalog-section[data-components]")];
const catalogPages = [...document.querySelectorAll("[data-catalog-page]")];
const pageNames = new Set(catalogPages.map((item) => item.dataset.catalogPage));
const pageSelect = document.querySelector("#catalog-page");
const localNav = document.createElement("nav");
localNav.className = "catalog-local-nav";
localNav.setAttribute("aria-label", "Components in this category");
document.querySelector("#main").prepend(localNav);

const searchGroup = document.querySelector("#catalog-search .moss-search-group");
searchGroup.replaceChildren();
for (const section of sections) {
  const link = document.createElement("a");
  link.href = '?page=' + section.dataset.catalogPage + '#' + section.id;
  link.dataset.searchItem = "";
  link.dataset.searchText = section.dataset.components + " " + section.querySelector("h2").textContent;
  const label = document.createElement("span"); label.textContent = section.querySelector("h2").textContent;
  const category = document.createElement("small"); category.textContent = section.dataset.catalogPage;
  link.append(label, category); searchGroup.append(link);
}
document.querySelectorAll("#catalog-search .moss-search-group").forEach((group, index) => { if (index > 0) group.remove(); });
document.querySelector("#catalog-search").filter();

const pageFromUrl = () => {
  const section = document.getElementById(decodeURIComponent(location.hash.slice(1)))?.closest(".catalog-section");
  const requested = section?.dataset.catalogPage || new URLSearchParams(location.search).get("page") || "overview";
  return pageNames.has(requested) ? requested : "overview";
};
const showCatalogPage = ({ focus = false } = {}) => {
  const page = pageFromUrl();
  catalogPages.forEach((item) => { item.hidden = item.dataset.catalogPage !== page; });
  document.querySelectorAll(".catalog-shell>moss-rail [data-catalog-page-link]").forEach((link) => {
    if (link.dataset.catalogPageLink === page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  pageSelect.value = page;
  localNav.replaceChildren(); localNav.hidden = page === "overview";
  for (const section of sections.filter((item) => item.dataset.catalogPage === page)) {
    const link = document.createElement("a"); link.href = '#' + section.id; link.textContent = section.querySelector("h2").textContent; localNav.append(link);
  }
  const heading = document.querySelector('.category-header[data-catalog-page="' + page + '"] h1') || document.querySelector("#overview h1");
  const header = heading.closest(".category-header");
  if (header) header.after(localNav);
  document.title = heading.textContent + " - Moss";
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target && !target.closest("[hidden]")) { target.scrollIntoView({ block: "start", behavior: "instant" }); if (focus) { target.tabIndex = -1; target.focus({ preventScroll: true }); } }
  else if (focus) { window.scrollTo({ top: 0, behavior: "instant" }); const target = header || document.querySelector("#main"); target.tabIndex = -1; target.focus({ preventScroll: true }); }
  if (matchMedia("(max-width: 44rem)").matches) requestAnimationFrame(() => {
    document.querySelector('.catalog-shell > moss-rail [aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  });
};
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return;
  if (!link.dataset.catalogPageLink && !url.hash && !url.searchParams.has("page")) return;
  event.preventDefault();
  document.querySelector("#catalog-search dialog").close();
  history.pushState({}, "", url); showCatalogPage({ focus: true });
});
pageSelect.addEventListener("change", () => { const url = new URL(location.href); url.hash = ""; url.searchParams.set("page", pageSelect.value); history.pushState({}, "", url); showCatalogPage({ focus: true }); });
window.addEventListener("popstate", () => showCatalogPage({ focus: true }));
window.addEventListener("hashchange", () => showCatalogPage({ focus: true }));
showCatalogPage();

const triage = document.querySelector(".moss-triage");
if (triage) {
  const items = [...triage.querySelectorAll("[data-triage-open]")];
  const back = triage.querySelector("[data-triage-back]");
  let opener = items[0];
  items.forEach((item) => item.addEventListener("click", (event) => {
    event.preventDefault();
    opener = item;
    items.forEach((candidate) => {
      if (candidate === item) candidate.setAttribute("aria-current", "page");
      else candidate.removeAttribute("aria-current");
    });
    ["title", "description", "amount", "evidence", "status"].forEach((field) => {
      const target = triage.querySelector(`[data-triage-${field}]`);
      if (target) target.textContent = item.dataset[field];
    });
    if (matchMedia("(max-width: 42rem)").matches) {
      triage.dataset.mobileView = "detail";
      triage.querySelector("#triage-detail")?.focus();
    }
  }));
  back?.addEventListener("click", () => {
    triage.dataset.mobileView = "queue";
    opener?.focus();
  });
}

// Author specimens once; expose their untouched markup and canonical contracts on demand.
const keyboardGuidance = {
  navigation: "Tab visits destinations; Enter follows links. The toggle preserves the user's expansion preference. Labels remain available on hover and focus.",
  actions: "Tab reaches enabled actions; Enter activates buttons; Space changes switches. Disabled actions stay unavailable; busy feedback retains the action's label.",
  'token-multiselect': "Type to filter; Enter adds the first visible suggestion; arrows move among suggestions; Escape closes them. Backspace on an empty input removes the last token. Hidden suggestions cannot be selected.",
  filtering: "Tab reaches tabs and filters. View tabs use arrows and Home/End. Column menus use arrows, Home/End, Enter, and Escape; filter forms retain native input keys. Menus escape table clipping.",
  tabs: "Peer tabs use Left/Right and Home/End with roving focus. The segmented-control recipe requires the host to update pressed state.",
  disclosure: "Enter or Space toggles the disclosure. Hidden content leaves keyboard navigation; the trigger retains focus.",
  overlays: "Enter or Down opens actions; Up opens at the last action. Arrows and Home/End move through menu items; Escape restores the trigger. Dialogs close with Escape, explicit actions, or an actual backdrop click. Tooltip labels remain hoverable and Escape dismisses them.",
  'task-drawer': "Tab stays within the native modal. Escape, backdrop, and close buttons request closure; the host may cancel moss-drawer-request-close for unsaved changes. Closure restores the opener.",
  'global-search': "Ctrl/Cmd K opens search. Input Home/End keep normal caret behavior; Down enters the first result and Up the last. Result arrows and Home/End move focus; Escape closes the native dialog.",
  wizard: "Continue checks native constraints and focuses the first invalid field; successful movement focuses the step heading. Back preserves the authored field values.",
  'file-picker': "Use the native file picker by keyboard or touch; Clear removes the file and allows reselection. The host validates bytes and manages upload progress.",
  'choice-cards': "Native radio arrows change the selected choice; Tab enters the group. Disabled choices remain unavailable.",
  'date-range': "Preset radios, date fields, and comparison switches retain native keyboard behavior. The product owns timezone and date arithmetic.",
  'triage-workspace': "Links select one record. On phones, selection reveals detail and focuses its heading; Back restores the selected queue link.",
  'evidence-workspace': "Read the decision and failed gate before exact observations. Source and evidence links use normal keyboard and browser navigation.",
  'chart-engine': "Tab reaches the plot and Chart data disclosure. Arrows and Home/End inspect points; native range, series, and slice selectors retain keyboard and touch behavior. Exact data rows can select a point."
};
let sourceDocument;
const sourceMarkup = async (id) => {
  sourceDocument ||= fetch("index.html").then((response) => { if (!response.ok) throw new Error("Source unavailable"); return response.text(); }).then((text) => new DOMParser().parseFromString(text, "text/html")).catch((error) => { sourceDocument = null; throw error; });
  const source = await sourceDocument;
  return source.getElementById(id).querySelector(".specimen").innerHTML.trim().replace(/></g, ">\n<");
};
async function documentContracts() {
  try {
    const response = await fetch("catalog-status.json"); if (!response.ok) throw new Error("Status unavailable");
    const contracts = await response.json();
    for (const section of sections) {
      const names = section.dataset.contracts.split("|");
      const records = names.map((name) => [name, contracts[name]]).filter(([, contract]) => contract);
      const maturity = document.createElement("p"); maturity.className = "component-maturity";
      maturity.textContent = records.map(([name, contract]) => name + ": " + contract.status).join("; ");
      section.querySelector(".section-copy").append(maturity);
      const tabs = document.createElement("moss-tabs"); tabs.className = "component-tabs";
      const tablist = document.createElement("div"); tablist.setAttribute("role", "tablist");
      tablist.setAttribute("aria-label", section.querySelector("h2").textContent + " documentation");
      tabs.append(tablist);
      const panels = {};
      for (const label of ["Example", "Implementation", "States", "Responsibilities"]) {
        const key = label.toLowerCase();
        const tab = document.createElement("button"); tab.type = "button"; tab.textContent = label;
        tab.id = section.id + "-tab-" + key; tab.setAttribute("role", "tab");
        tab.setAttribute("aria-selected", String(key === "example"));
        const panel = document.createElement("div"); panel.id = section.id + "-panel-" + key;
        panel.setAttribute("role", "tabpanel"); panel.hidden = key !== "example";
        if (key !== "example") { panel.className = "component-contract"; panel.tabIndex = 0; }
        tablist.append(tab); tabs.append(panel); panels[key] = panel;
      }
      const intro = document.createElement("p"); intro.textContent = "Catalog demonstration. Product data, submission, and routing belong to the host unless the contract below explicitly supplies them."; panels.responsibilities.append(intro);
      for (const [name, contract] of records) {
        const heading = document.createElement("h3"); heading.textContent = name;
        const states = document.createElement("p"); states.textContent = "Supported: " + contract.states + ".";
        const gaps = document.createElement("p"); gaps.textContent = "Responsibilities and gaps: " + contract.gaps + ".";
        panels.states.append(heading, states); panels.responsibilities.append(heading.cloneNode(true), gaps);
      }
      const keyboard = document.createElement("p"); keyboard.textContent = keyboardGuidance[section.id] || "Native controls retain their keyboard and focus behavior. Presentational recipes do not add interaction; the host supplies actions and meaningful accessible names.";
      const lifecycle = document.createElement("p"); lifecycle.textContent = section.id === "chart-engine"
        ? "MossChart renders loading, empty, partial, and error states from attributes and data. Disabled charts retain exact data but stop selection. The host owns fetching, aborts, data recovery, and narrative accuracy. See design/charts.md for lifecycle and host coverage."
        : "Loading, empty, partial, and error content remain host-authored: mark the affected region busy, keep available evidence visible, and show an explicit recovery action. Long content wraps or scrolls within its evidence region; page-scale previews adapt to their allocated width. Disabled controls use native disabled semantics.";
      const keyboardHeading = document.createElement("h3"); keyboardHeading.textContent = "Keyboard and focus";
      panels.states.append(keyboardHeading, keyboard); panels.responsibilities.append(lifecycle);
      const toolbar = document.createElement("div"); toolbar.className = "contract-copy";
      const copy = document.createElement("button"); copy.type = "button"; copy.className = "moss-button moss-button--secondary moss-button--icon";
      copy.setAttribute("aria-label", "Copy example markup"); copy.dataset.mossTooltip = "Copy example markup";
      const copyIcon = document.createElement("moss-icon"); copyIcon.setAttribute("name", "copy"); copy.append(copyIcon);
      const retry = document.createElement("button"); retry.type = "button"; retry.className = "moss-button moss-button--secondary"; retry.textContent = "Retry"; retry.hidden = true;
      const status = document.createElement("span"); status.setAttribute("role", "status");
      const sourceLink = document.createElement("a"); sourceLink.href = "/moss/src/moss.js"; sourceLink.textContent = "Behavior source";
      const cssLink = document.createElement("a"); cssLink.href = "/moss/src/moss.css"; cssLink.textContent = "Styles";
      toolbar.append(copy, sourceLink, cssLink, retry, status); panels.implementation.append(toolbar);
      const pre = document.createElement("pre"); pre.tabIndex = 0; pre.setAttribute("aria-label", "Example markup");
      const code = document.createElement("code"); pre.append(code); panels.implementation.append(pre);
      let loadingMarkup;
      const loadMarkup = () => {
        if (code.textContent) return Promise.resolve();
        if (!loadingMarkup) {
          status.textContent = "Loading example..."; retry.hidden = true; pre.setAttribute("aria-busy", "true");
          loadingMarkup = sourceMarkup(section.id).then((markup) => { code.textContent = markup; status.textContent = ""; })
            .catch(() => { status.textContent = "Could not load markup. Retry to load it again."; retry.hidden = false; })
            .finally(() => { loadingMarkup = null; pre.removeAttribute("aria-busy"); });
        }
        return loadingMarkup;
      };
      const implementationTab = tablist.children[1];
      implementationTab.addEventListener("click", loadMarkup); implementationTab.addEventListener("focus", loadMarkup);
      retry.addEventListener("click", loadMarkup);
      copy.addEventListener("click", async () => {
        await loadMarkup(); if (!code.textContent) return;
        try { await navigator.clipboard.writeText(code.textContent); status.textContent = "Markup copied"; }
        catch { status.textContent = "Copy unavailable. Select the example below to copy it."; }
      });
      panels.example.append(section.querySelector(".specimen")); section.append(tabs);
    }
  } catch {
    const message = document.createElement("p"); message.setAttribute("role", "status"); message.textContent = "Component contracts could not load. Reload to retry; implementation source remains available in the repository."; document.querySelector("#main").append(message);
  }
}
documentContracts();
