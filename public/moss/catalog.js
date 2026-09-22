import { createMossTheme } from "/moss/theme.js";
import { frogThemes } from "/moss/themes.js";

const root = document.documentElement;
const density = document.querySelector("#density");
const theme = document.querySelector("#theme");
const character = document.querySelector("#character");
const preferenceKey = "moss-catalog-preferences";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(preferenceKey) || "{}"); } catch { saved = {}; }
let mode = saved.mode === "light" ? "light" : "dark";
if (frogThemes[saved.character]) character.value = saved.character;
if (["comfortable", "balanced", "compact"].includes(saved.density)) density.value = saved.density;

const applyTheme = () => {
  const selected = createMossTheme({ ...frogThemes[character.value], mode, density: density.value });
  selected.apply(root);
  document.querySelector('meta[name="theme-color"]').content = selected.toVariables(mode, density.value)["--moss-canvas"];
  localStorage.setItem(preferenceKey, JSON.stringify({ character: character.value, density: density.value, mode }));
};

density.addEventListener("change", applyTheme);
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

const sections = [...document.querySelectorAll("main section[id]")];
const links = [...document.querySelectorAll(".catalog-shell>moss-rail nav a")];
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  links.forEach((link) => {
    if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}), { rootMargin: "-25% 0px -65%" });
sections.forEach((section) => observer.observe(section));
