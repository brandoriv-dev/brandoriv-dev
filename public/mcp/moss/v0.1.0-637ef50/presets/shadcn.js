import { createMossTheme } from "../core/theme.js";

// Values, rather than a second theme implementation, can be persisted by any host.
export const shadcnTheme = createMossTheme({
  name: "shadcn",
  mode: "system",
  density: "balanced",
  palette: {
    light: {
      canvas: "#ffffff", surface: "#ffffff", surfaceRaised: "#fafafa", surfaceStrong: "#f0f0f0",
      text: "#171717", textMuted: "#595959", textFaint: "#626262",
      border: "#858585", borderSoft: "#e5e5e5",
      primary: "#171717", primaryStrong: "#262626", primarySurface: "#f0f0f0",
      secondary: "#404040", secondaryStrong: "#262626", secondarySurface: "#f0f0f0",
      status: { positive: "#166534", warning: "#854d0e", critical: "#b91c1c", info: "#1d4ed8" }
    },
    dark: {
      canvas: "#0a0a0a", surface: "#171717", surfaceRaised: "#1f1f1f", surfaceStrong: "#262626",
      text: "#fafafa", textMuted: "#c4c4c4", textFaint: "#b3b3b3",
      border: "#737373", borderSoft: "#404040",
      primary: "#fafafa", primaryStrong: "#e5e5e5", primarySurface: "#262626",
      secondary: "#d4d4d4", secondaryStrong: "#e5e5e5", secondarySurface: "#262626",
      status: { positive: "#86efac", warning: "#fcd34d", critical: "#fca5a5", info: "#93c5fd" }
    },
    status: { positive: "#166534", warning: "#854d0e", critical: "#b91c1c", info: "#1d4ed8" },
    data: ["#2563eb", "#0d9488", "#d97706", "#9333ea", "#e11d48"]
  },
  typography: {
    sans: '"Geist Variable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: "var(--moss-font-sans)", display: "var(--moss-font-heading)",
    mono: 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
    headingTracking: "0", displayTracking: "0", bodyTracking: "0",
    headingWeight: "600", displayWeight: "600", headingLineHeight: 1.25
  },
  geometry: { sharpness: 0, radiusMin: ".375rem", radiusMax: ".5rem", borderWidth: "1px" },
  elevation: {
    surface: "none",
    raised: "0 1px 2px rgb(0 0 0 / .08)",
    overlay: "0 8px 24px rgb(0 0 0 / .18)"
  },
  interaction: { focusWidth: "2px", focusOpacity: "100%", hoverLift: "0px", disabledOpacity: ".5" },
  charts: { strokeWidth: "2", gridOpacity: ".18", barRadius: "0", pointRadius: "3", areaOpacity: ".12" }
}).toJSON();

export function createShadcnTheme(overrides = {}) {
  const values = structuredClone(shadcnTheme);
  // A shared status override must win over the preset's mode defaults, just as
  // it does in MossTheme's constructor; an explicit mode override still wins.
  if (overrides.palette?.status) {
    for (const mode of ["light", "dark"]) {
      Object.assign(values.palette[mode].status, overrides.palette.status);
    }
  }
  return createMossTheme(values).with(overrides);
}
