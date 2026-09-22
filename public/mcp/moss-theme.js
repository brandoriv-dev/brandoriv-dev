import { MossTheme } from "/mcp/moss/v0.1.0-e8e0f10/theme.js";

const system = window.matchMedia("(prefers-color-scheme: dark)");
const storageKey = "brandoriv-theme";
const mcpTheme = new MossTheme({
  name: "Tree Frog MCP",
  density: "balanced",
  palette: {
    dark: {
      canvas: "#17221f", surface: "#101916", surfaceRaised: "#1d2b26", surfaceStrong: "#263a32",
      text: "#f5f8e9", textMuted: "#b8c6b7", textFaint: "#829589", border: "#365247", borderSoft: "#293f37",
      accent: "#76dc58", accentStrong: "#a8f17f", accentSurface: "#24472b"
    },
    light: {
      canvas: "#edf3e7", surface: "#fbfff7", surfaceRaised: "#e2edda", surfaceStrong: "#d4e5c8",
      text: "#183028", textMuted: "#50675c", textFaint: "#74877c", border: "#abc2af", borderSoft: "#cfddcf",
      accent: "#338a35", accentStrong: "#176d2b", accentSurface: "#d7f2c9"
    },
    status: { positive: "#5fc548", warning: "#ffc247", critical: "#ff7658", info: "#45c7c2" },
    data: ["#45c7c2", "#76dc58", "#8f7bf2", "#ffc247", "#ff7658"]
  },
  typography: {
    sans: '"IBM Plex Sans", "Segoe UI Variable Text", "Segoe UI", Arial, sans-serif',
    heading: '"IBM Plex Sans", "Segoe UI Variable Display", "Segoe UI", Arial, sans-serif',
    mono: '"JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
    baseSize: ".9375rem", headingWeight: "600", headingTracking: "-.025em"
  },
  layout: { railExpanded: "14.5rem", railCollapsed: "4.75rem", topbarHeight: "4.25rem" },
  geometry: { radiusSm: ".375rem", radiusMd: ".625rem", radiusLg: ".875rem", borderWidth: "1px" },
  motion: { fast: "130ms", normal: "210ms", ease: "cubic-bezier(.18,.8,.2,1)" },
  components: { rail: { collapsible: true, collapsedTooltips: true }, table: { defaultDensity: "compact" }, bars: { radius: "0" } }
});

function applyMossTheme() {
  let choice = "system";
  try { choice = window.localStorage.getItem(storageKey) || "system"; } catch {}
  const mode = choice === "system" ? (system.matches ? "dark" : "light") : choice;
  mcpTheme.apply(document.documentElement, { mode, density: "balanced" });
}

applyMossTheme();
document.addEventListener("change", event => {
  if (event.target instanceof HTMLSelectElement && event.target.matches("[data-theme-choice]")) applyMossTheme();
});
system.addEventListener("change", applyMossTheme);
window.addEventListener("storage", event => { if (event.key === storageKey || event.key === null) applyMossTheme(); });
