import "/moss/src/moss.js";
import "/moss/src/charts.js";
import { createMossTheme } from "/moss/src/theme.js";
import { shadcnTheme, createShadcnTheme } from "/moss/src/presets/shadcn.js";
import { chartExamples, getChartExample } from "/moss/src/chart-recipes.js";
import { frogThemes } from "./themes.js";

const root = document.documentElement;
const productThemes = { neutral: shadcnTheme, ...frogThemes };
const character = document.querySelector("#character");
const themeToggle = document.querySelector("#theme");
const preferenceKey = "moss-catalog-preferences";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(preferenceKey) || "{}"); } catch { /* preferences are optional */ }
if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};
let mode = saved.mode === "dark" ? "dark" : "light";
for (const [key, values] of Object.entries(frogThemes)) character.add(new Option(values.name, key));
character.value = Object.hasOwn(productThemes, saved.character) ? saved.character : "neutral";

function applyTheme() {
  const neutral = character.value === "neutral";
  if (neutral) root.dataset.mossStyle = "shadcn";
  else root.removeAttribute("data-moss-style");
  const theme = neutral ? createShadcnTheme({ mode }) : createMossTheme({ ...productThemes[character.value], mode });
  theme.apply(root);
  document.querySelector('meta[name="theme-color"]').content = theme.toVariables(mode)["--moss-canvas"];
  themeToggle.setAttribute("aria-pressed", String(mode === "dark"));
  themeToggle.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`);
  try { localStorage.setItem(preferenceKey, JSON.stringify({ ...saved, character: character.value, mode })); } catch { /* preferences are optional */ }
}
character.addEventListener("change", applyTheme);
themeToggle.addEventListener("click", () => { mode = mode === "light" ? "dark" : "light"; applyTheme(); });
applyTheme();

const families = {
  area: { title: "Area", description: "Magnitude and composition across an ordered interval.", use: "The amount under a trend or the changing contribution of parts matters.", avoid: "Precise series comparison needs a Line chart, or unordered categories need a Bar chart.", mobile: "Reduces axis labels while retaining the filled trend, range controls, and exact data." },
  bar: { title: "Bar", description: "Comparisons between categories, periods, or signed values.", use: "Readers compare quantities with a shared baseline.", avoid: "Continuity is the question; use a Line chart for an ordered trend.", mobile: "Preserves category labels and moves crowded values into the exact data disclosure." },
  line: { title: "Line", description: "Direction and differences across ordered observations.", use: "Readers track change or compare series through time.", avoid: "Unordered category ranking is the task; use a Bar chart.", mobile: "Reduces tick density while point selection and exact values remain reachable." },
  pie: { title: "Pie", description: "Parts of one meaningful whole, including donut variants.", use: "A small set of nonnegative parts shares one denominator.", avoid: "Close values or unrelated totals require a Bar chart for comparison.", mobile: "Keeps sector geometry readable and reveals small shares through selection and exact data." },
  radar: { title: "Radar", description: "Profiles measured across a shared set of dimensions.", use: "Readers compare profiles with consistent scales and axis order.", avoid: "Accurate ranking across independent measures needs a Bar chart or Dense table.", mobile: "Reduces peripheral label detail and preserves dimension names in exact data." },
  radial: { title: "Radial", description: "Bounded values and contributions around a circular scale.", use: "A circular scale has an explicit total or bound and only a few series.", avoid: "Precise differences or long category lists need a Bar chart.", mobile: "Preserves the circular scale and makes labels and values available in the data disclosure." },
  tooltip: { title: "Tooltip", description: "Context and formatting attached to inspectable data points.", use: "A plotted point needs contextual labels, indicators, or formatted values.", avoid: "Essential evidence would exist only on hover; use the chart summary or Dense table.", mobile: "Touch selection and the exact data disclosure expose values without requiring hover." }
};
const familySelect = document.querySelector("#chart-family");
const search = document.querySelector("#chart-search");
const container = document.querySelector("#chart-families");
const count = document.querySelector("#chart-count");
const clear = document.querySelector("#chart-clear");
const empty = document.querySelector("#chart-empty");
const phoneLayout = matchMedia("(max-width: 48rem)");
const groups = [];
const items = [];
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

function exampleCode(id) {
  return `<link rel="stylesheet" href="/moss/src/shadcn.css">
<link rel="stylesheet" href="/moss/src/charts.css">
<moss-chart id="${id}-preview" preset="${id}"></moss-chart>
<script type="module">
import "/moss/src/moss.js";
import "/moss/src/charts.js";
import { createShadcnTheme } from "/moss/src/presets/shadcn.js";
import { getChartExample } from "/moss/src/chart-recipes.js";

document.documentElement.dataset.mossStyle = "shadcn";
createShadcnTheme({ mode: "light" }).apply(document.documentElement);
const chart = document.querySelector("#${id}-preview");
chart.config = getChartExample("${id}");
// Replace chart.data with product rows; keep summary accurate.
</script>`;
}

function chartItem(example) {
  const article = node("article", "chart-example");
  article.id = example.id;
  article.dataset.chartExample = example.id;
  article.dataset.family = example.family;
  const header = node("header");
  const title = node("h3");
  const permalink = node("a", "", example.title);
  permalink.href = `#${example.id}`;
  title.append(permalink);
  header.append(title);
  if (example.description) header.append(node("p", "", example.description));
  header.append(node("code", "", example.id));
  const chart = node("moss-chart");
  chart.id = `${example.id}-preview`;
  chart.setAttribute("preset", example.id);
  chart.setAttribute("summary", example.summary);
  const footer = node("footer");
  const source = node("a", "", "shadcn source");
  source.href = example.source;
  footer.append(source);
  const details = node("details", "chart-code");
  details.append(node("summary", "", "Example code"));
  const toolbar = node("div", "chart-code-toolbar");
  const copy = node("button", "moss-button moss-button--quiet moss-button--icon");
  copy.type = "button";
  copy.setAttribute("aria-label", `Copy ${example.title} example`);
  copy.dataset.mossTooltip = "Copy example";
  const icon = node("moss-icon"); icon.setAttribute("name", "copy"); copy.append(icon);
  const status = node("span", "chart-copy-status"); status.setAttribute("role", "status");
  toolbar.append(copy, status);
  const pre = node("pre"); pre.tabIndex = 0;
  pre.setAttribute("aria-label", `${example.title} example code`);
  const code = node("code"); pre.append(code);
  details.append(toolbar, pre);
  details.addEventListener("toggle", () => { if (details.open && !code.textContent) code.textContent = exampleCode(example.id); });
  copy.addEventListener("click", async () => {
    code.textContent ||= exampleCode(example.id);
    try { await navigator.clipboard.writeText(code.textContent); status.textContent = "Example copied"; }
    catch { status.textContent = "Copy unavailable. Select the code to copy it."; pre.focus(); }
  });
  article.append(header, chart, footer, details);
  items.push({ article, family: example.family, searchText: [example.id, example.title, example.description, example.summary].filter(Boolean).join(" ").toLowerCase() });
  return article;
}

for (const [family, guidance] of Object.entries(families)) {
  const section = node("section", "chart-family"); section.id = `family-${family}`;
  section.setAttribute("aria-labelledby", `${section.id}-title`);
  const copy = node("div", "section-copy");
  const heading = node("h2", "", guidance.title); heading.id = `${section.id}-title`;
  copy.append(heading, node("p", "", guidance.description));
  const applicability = node("dl");
  for (const [label, text] of [["Use when", guidance.use], ["Avoid when", guidance.avoid], ["Mobile", guidance.mobile]]) {
    const row = node("div"); row.append(node("dt", "", label), node("dd", "", text)); applicability.append(row);
  }
  const guidanceDetails = node("details", "chart-applicability");
  guidanceDetails.open = !phoneLayout.matches;
  guidanceDetails.append(node("summary", "", "Family guidance"), applicability);
  copy.append(guidanceDetails);
  const grid = node("div", "chart-grid");
  for (const example of chartExamples.filter((example) => example.family === family)) grid.append(chartItem(example));
  section.append(copy, grid); groups.push({ family, section }); container.append(section);
}
container.setAttribute("aria-busy", "false");
phoneLayout.addEventListener("change", () => {
  for (const group of groups) group.section.querySelector(".chart-applicability").open = !phoneLayout.matches;
});

function filterCharts({ updateUrl = true } = {}) {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  const visibleFamilies = new Set();
  for (const item of items) {
    item.article.hidden = (familySelect.value !== "all" && item.family !== familySelect.value) || !item.searchText.includes(query);
    if (!item.article.hidden) { visible++; visibleFamilies.add(item.family); }
  }
  for (const group of groups) group.section.hidden = !visibleFamilies.has(group.family);
  count.textContent = `${visible} of ${items.length} charts`;
  clear.disabled = !query && familySelect.value === "all";
  empty.hidden = visible !== 0;
  if (updateUrl) {
    const url = new URL(location.href);
    if (familySelect.value === "all") url.searchParams.delete("family");
    else url.searchParams.set("family", familySelect.value);
    if (search.value.trim()) url.searchParams.set("q", search.value.trim());
    else url.searchParams.delete("q");
    // A filtered-out permalink must not override the filters on a reload.
    const linked = items.find((item) => `#${item.article.id}` === url.hash);
    if (linked?.article.hidden) url.hash = "";
    history.replaceState({}, "", url);
  }
}

function revealHash() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const example = getChartExample(id);
  if (!example) return;
  const item = items.find((item) => item.article.id === id);
  if (item.article.hidden) { familySelect.value = example.family; search.value = ""; filterCharts(); }
  requestAnimationFrame(() => item.article.scrollIntoView({ block: "start" }));
}

function restoreFilters() {
  const params = new URLSearchParams(location.search);
  familySelect.value = Object.hasOwn(families, params.get("family")) ? params.get("family") : "all";
  search.value = params.get("q") || "";
  filterCharts({ updateUrl: false }); revealHash();
}
function clearFilters() { search.value = ""; familySelect.value = "all"; filterCharts(); search.focus(); }
search.addEventListener("input", () => filterCharts());
familySelect.addEventListener("change", () => filterCharts());
document.querySelector(".charts-filters").addEventListener("submit", (event) => event.preventDefault());
document.querySelector(".charts-filters").addEventListener("reset", (event) => { event.preventDefault(); clearFilters(); });
document.querySelector("#chart-empty-clear").addEventListener("click", clearFilters);
window.addEventListener("popstate", restoreFilters);
window.addEventListener("hashchange", revealHash);
restoreFilters();
