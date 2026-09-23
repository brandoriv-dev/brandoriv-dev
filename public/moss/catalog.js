import { createMossTheme } from "/moss/theme.js";
import { frogThemes } from "/moss/themes.js";

const root = document.documentElement;
const theme = document.querySelector("#theme");
const character = document.querySelector("#character");
const currentTheme = document.querySelector("[data-theme-current]");
const themeComparison = document.querySelector("[data-theme-comparison]");
const themeValues = document.querySelector("[data-theme-values]");
const preferenceKey = "moss-catalog-preferences";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(preferenceKey) || "{}"); } catch { saved = {}; }
let mode = saved.mode === "light" ? "light" : "dark";
if (frogThemes[saved.character]) character.value = saved.character;

const themeEntries = Object.entries(frogThemes);
const comparisonRows = [
  ["Default density", (value) => value.density],
  ["Primary", (value) => value.palette.dark.primary, "color"],
  ["Secondary", (value) => value.palette.dark.secondary, "color"],
  ["Typeface", (value) => value.typography.sans.split(",")[0].replaceAll('"', "")],
  ["Type scale", (value) => value.typography.scale],
  ["Sharpness", (value) => value.geometry.sharpness],
  ["Section rhythm", (value) => value.spacing.section],
  ["Raised elevation", (value) => value.elevation.raised],
  ["Motion", (value) => value.motion.normal],
  ["Focus ring", (value) => `${value.interaction.focusWidth} / ${value.interaction.focusOpacity}`],
  ["Rail", (value) => `${value.layout.railExpanded} / ${value.layout.railCollapsed}`],
  ["Chart", (value) => `${value.charts.strokeWidth}px / ${value.charts.barRadius} bars`],
  ["Button emphasis", (value) => value.components.button.emphasis]
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
  themeComparison.append(table);

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
  const value = frogThemes[key];
  currentTheme.replaceChildren();
  const copy = document.createElement("div");
  const eyebrow = document.createElement("span"); eyebrow.className = "moss-eyebrow"; eyebrow.textContent = "Applied theme";
  const heading = document.createElement("h3"); heading.textContent = value.name;
  const description = document.createElement("p"); description.textContent = `${value.density} density, ${value.geometry.sharpness} sharpness, ${value.typography.scale} type scale`;
  copy.append(eyebrow, heading, description);
  const swatches = document.createElement("div"); swatches.className = "theme-swatches"; swatches.setAttribute("aria-label", "Primary, secondary, and data colors");
  [value.palette.dark.primary, value.palette.dark.secondary, ...value.palette.data].forEach((color) => { const swatch = document.createElement("span"); swatch.className = "theme-swatch"; swatch.style.setProperty("--swatch", color); swatch.title = color; swatches.append(swatch); });
  currentTheme.append(copy, swatches);
  document.querySelectorAll("[data-theme-values]").forEach((item) => item.toggleAttribute("data-current", item.dataset.themeValues === key));
};

buildThemeDocumentation();

const applyTheme = () => {
  const selected = createMossTheme({ ...frogThemes[character.value], mode });
  selected.apply(root);
  document.querySelector('meta[name="theme-color"]').content = selected.toVariables(mode, selected.density)["--moss-canvas"];
  localStorage.setItem(preferenceKey, JSON.stringify({ character: character.value, mode }));
  updateThemeDocumentation(character.value);
};

character.addEventListener("change", applyTheme);
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
  setTimeout(() => { event.currentTarget.removeAttribute("aria-busy"); event.currentTarget.textContent = "Run report"; toast("Report is ready"); }, 900);
});
document.querySelector("#showToast").addEventListener("click", () => toast("Workspace is already quiet"));

const catalogPages = [...document.querySelectorAll("[data-catalog-page]")];
const pageNames = new Set(catalogPages.map((item) => item.dataset.catalogPage));
const pageLinks = [...document.querySelectorAll("[data-catalog-page-link]")];
const railLinks = [...document.querySelectorAll(".catalog-shell>moss-rail [data-catalog-page-link]")];
const pageSelect = document.querySelector("#catalog-page");

const pageFromUrl = () => {
  const requested = new URLSearchParams(location.search).get("page") || "overview";
  return pageNames.has(requested) ? requested : "overview";
};

const showCatalogPage = (page, { focus = false, scroll = false } = {}) => {
  catalogPages.forEach((item) => { item.hidden = item.dataset.catalogPage !== page; });
  railLinks.forEach((link) => {
    if (link.dataset.catalogPageLink === page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  pageSelect.value = page;
  const heading = document.querySelector(`.category-header[data-catalog-page="${page}"] h1`) || document.querySelector("#overview h1");
  document.title = `${heading.textContent} - Moss`;
  if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
  if (focus) (heading.closest(".category-header") || document.querySelector("#main")).focus({ preventScroll: true });
};

const navigateToPage = (page) => {
  const url = new URL(location.href);
  if (page === "overview") url.searchParams.delete("page");
  else url.searchParams.set("page", page);
  url.hash = "";
  history.pushState({ catalogPage: page }, "", url);
  showCatalogPage(page, { focus: true, scroll: true });
};

pageLinks.forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  navigateToPage(link.dataset.catalogPageLink);
}));
pageSelect.addEventListener("change", () => navigateToPage(pageSelect.value));
window.addEventListener("popstate", () => showCatalogPage(pageFromUrl(), { focus: true, scroll: true }));
showCatalogPage(pageFromUrl());
