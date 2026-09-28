import "/moss/src/moss.js";
import { createMossTheme } from "/moss/src/theme.js";

const root = document.documentElement;
const modeToggle = document.querySelector("#mode-toggle");
const density = document.querySelector("#density");
let mode = "light";

const applyTheme = () => createMossTheme({ mode, density: density.value }).apply(root);
applyTheme();

modeToggle.addEventListener("click", () => {
  mode = mode === "light" ? "dark" : "light";
  modeToggle.setAttribute("aria-pressed", String(mode === "dark"));
  modeToggle.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`);
  applyTheme();
});

density.addEventListener("change", applyTheme);
