// Catalog fixtures demonstrate the contract. Product themes belong in each
// product (or a separate theme package), never in the MossTheme engine.
export const catalogThemes = {
  neutral: { name: "Moss neutral" },
  vivid: {
    name: "Vivid cool example",
    palette: {
      dark: { canvas: "#11191d", surface: "#182329", surfaceRaised: "#202e35", surfaceStrong: "#293a42", text: "#f3f8f7", textMuted: "#abc0bd", textFaint: "#78918e", border: "#344a50", borderSoft: "#273b41", primary: "#39d98a", primaryStrong: "#83f2b8", primarySurface: "#123e2b", secondary: "#42a5ff", secondaryStrong: "#8bc8ff", secondarySurface: "#173853" },
      light: { canvas: "#f1f6f4", surface: "#ffffff", surfaceRaised: "#e5eeeb", surfaceStrong: "#d8e5e1", text: "#14211f", textMuted: "#4e6561", textFaint: "#728783", border: "#bfd0cb", borderSoft: "#d5e0dd", primary: "#087848", primaryStrong: "#005d36", primarySurface: "#d2efdf", secondary: "#176cab", secondaryStrong: "#0a507f", secondarySurface: "#d9eafa" },
      status: { positive: "#39d98a", warning: "#f0bd3d", critical: "#f0645a", info: "#42a5ff" },
      data: ["#42a5ff", "#39d98a", "#8b77ee", "#f0bd3d", "#f0645a"]
    },
    typography: { scale: 1.16, headingWeight: "650" },
    geometry: { sharpness: 0.72 },
    charts: { strokeWidth: "2", barRadius: "0" }
  }
};
