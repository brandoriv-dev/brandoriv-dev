import { MossTheme } from "/mcp/moss/v0.1.0-e8e0f10/theme.js";

const system = window.matchMedia("(prefers-color-scheme: dark)");
const storageKey = "brandoriv-theme";
const mcpTheme = new MossTheme({
  name: "MCP Console",
  density: "balanced",
  palette: {
    dark: {
      canvas: "#1f2221", surface: "#171a18", surfaceRaised: "#202421", surfaceStrong: "#2a2f2b",
      text: "#f2f3f0", textMuted: "#a8adaa", textFaint: "#7f8983", border: "#3a403c", borderSoft: "#303432",
      accent: "#84cc62", accentStrong: "#aae58a", accentSurface: "#263b27"
    },
    light: {
      canvas: "#ececea", surface: "#f9f9f7", surfaceRaised: "#f0f0ee", surfaceStrong: "#e6e8e5",
      text: "#1b201e", textMuted: "#646a67", textFaint: "#7b827e", border: "#bcc0bd", borderSoft: "#d6d8d5",
      accent: "#347c3e", accentStrong: "#195c43", accentSurface: "#e2f1d9"
    },
    status: { positive: "#75c653", warning: "#f5b83a", critical: "#ff8156", info: "#63c7bc" },
    data: ["#63c7bc", "#84cc62", "#a99af2", "#f5b83a", "#ff8156"]
  },
  typography: {
    sans: '"IBM Plex Sans", "Segoe UI Variable Text", "Segoe UI", Arial, sans-serif',
    heading: '"IBM Plex Sans", "Segoe UI Variable Display", "Segoe UI", Arial, sans-serif',
    mono: '"JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
    baseSize: ".9375rem", headingWeight: "600", headingTracking: "-.025em"
  },
  layout: { railExpanded: "14.5rem", railCollapsed: "4.75rem", topbarHeight: "4.25rem" },
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
