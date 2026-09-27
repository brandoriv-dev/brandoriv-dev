const DEFAULT_THEME = {
  name: "Moss", mode: "dark", density: "balanced",
  palette: {
    dark: { canvas: "#191b19", surface: "#222522", surfaceRaised: "#292d29", surfaceStrong: "#303530", text: "#f4f2e9", textMuted: "#afb5ad", textFaint: "#a0aaa1", border: "#3b403b", borderSoft: "#303430", primary: "#74d69b", primaryStrong: "#9be9b8", primarySurface: "#254a34", secondary: "#7fa9ff", secondaryStrong: "#a9c4ff", secondarySurface: "#253855", status: { positive: "#74d69b", warning: "#efc36b", critical: "#ff8a69", info: "#7fa9ff" } },
    light: { canvas: "#f4f4ef", surface: "#ffffff", surfaceRaised: "#eceee9", surfaceStrong: "#e2e5df", text: "#1d221e", textMuted: "#59635b", textFaint: "#59635b", border: "#cbd1ca", borderSoft: "#dde1dc", primary: "#216b42", primaryStrong: "#165f39", primarySurface: "#d9eee1", secondary: "#285fae", secondaryStrong: "#174983", secondarySurface: "#dce8fa", status: { positive: "#216b42", warning: "#8a5d00", critical: "#a83225", info: "#285fae" } },
    status: { positive: "#43a86d", warning: "#c88b20", critical: "#d45d48", info: "#4f82d2" },
    data: ["#4f82d2", "#43a86d", "#8a72d6", "#c88b20", "#d45d48"]
  },
  typography: { sans: '"Manrope", "DM Sans", ui-sans-serif, system-ui, sans-serif', heading: "var(--moss-font-sans)", display: "var(--moss-font-heading)", mono: '"DM Mono", "SFMono-Regular", Consolas, monospace', baseSize: "1rem", scale: 1.2, bodyWeight: "400", mediumWeight: "500", headingWeight: "600", headingTracking: "-.035em", displayWeight: "700", displayTracking: "-.035em", bodyTracking: "0", lineHeight: 1.5, headingLineHeight: 1.12 },
  // Print character as an authored value. A product that wants paper rather than glass raises grain.
  texture: { grain: 0, grainSize: "180px", paperTint: "transparent" },
  densityScale: {
    comfortable: { control: "2.75rem", row: "3.5rem", gap: "1rem", inset: "1rem" },
    balanced: { control: "2.375rem", row: "2.625rem", gap: ".75rem", inset: ".75rem" },
    compact: { control: "2rem", row: "2rem", gap: ".5rem", inset: ".625rem" }
  },
  spacing: { unit: ".25rem", section: "2rem", page: "clamp(1rem, 3vw, 2.5rem)", contentMax: "90rem" },
  geometry: { sharpness: 0.55, radiusMin: ".125rem", radiusMax: "1rem", borderWidth: "1px" },
  elevation: { surface: "none", raised: "0 .5rem 1.5rem rgb(0 0 0 / .16)", overlay: "0 1.25rem 3.75rem rgb(0 0 0 / .38)" },
  motion: { fast: "140ms", normal: "220ms", slow: "360ms", ease: "cubic-bezier(.2,.8,.2,1)", distance: ".25rem" },
  interaction: { focusWidth: "3px", focusOpacity: "26%", hoverLift: "-1px", disabledOpacity: ".48", targetMin: "2.75rem" },
  layout: { railExpanded: "15rem", railCollapsed: "4.75rem", topbarHeight: "4rem" },
  charts: { strokeWidth: "2.5", gridOpacity: ".18", barRadius: "0", pointRadius: "3", areaOpacity: ".14" },
  components: { rail: { collapsible: true }, table: { defaultDensity: "compact" } }
};

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const merge = (base, override = {}) => Object.fromEntries(Object.keys({ ...base, ...override }).map((key) => [key, isObject(base?.[key]) && isObject(override?.[key]) ? merge(base[key], override[key]) : (override?.[key] ?? base?.[key])]));
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));
const rem = (value) => Number.parseFloat(value) || 0;
const radius = (min, max, sharpness, position) => `${min + (max - min) * (1 - sharpness) * position}rem`;
const paletteVariables = { canvas: "--moss-canvas", surface: "--moss-surface", surfaceRaised: "--moss-surface-raised", surfaceStrong: "--moss-surface-strong", text: "--moss-text", textMuted: "--moss-text-muted", textFaint: "--moss-text-faint", border: "--moss-border", borderSoft: "--moss-border-soft", primary: "--moss-primary", primaryStrong: "--moss-primary-strong", primarySurface: "--moss-primary-surface", secondary: "--moss-secondary", secondaryStrong: "--moss-secondary-strong", secondarySurface: "--moss-secondary-surface" };
const resolveMode = (mode) => mode === "system" ? (globalThis.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark") : mode;
const hexPattern = /^#[0-9a-f]{6}$/i;
const luminance = (hex) => {
  const channels = hex.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
};
const contrast = (first, second) => {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
};

class MossTheme {
  constructor(values = {}) {
    const merged = merge(DEFAULT_THEME, values);
    // Shared status overrides apply to both modes unless the caller supplies a mode color.
    if (values.palette?.status) for (const mode of ["dark", "light"]) {
      merged.palette[mode].status = { ...merged.palette[mode].status, ...values.palette.status, ...values.palette[mode]?.status };
    }
    if (!["light", "dark", "system"].includes(merged.mode)) throw new TypeError(`Unsupported Moss mode: ${merged.mode}`);
    if (!merged.densityScale[merged.density]) throw new TypeError(`Unsupported Moss density: ${merged.density}`);
    if (!Array.isArray(merged.palette.data) || merged.palette.data.length < 2) throw new TypeError("MossTheme requires at least two data colors");
    if (!Number.isFinite(Number(merged.geometry.sharpness)) || merged.geometry.sharpness < 0 || merged.geometry.sharpness > 1) throw new TypeError("MossTheme sharpness must be between 0 and 1");
    for (const mode of ["dark", "light"]) for (const key of Object.keys(DEFAULT_THEME.palette[mode])) {
      if (key !== "status" && !hexPattern.test(merged.palette[mode][key])) throw new TypeError(`MossTheme palette.${mode}.${key} must be a six-digit hex color`);
    }
    for (const tone of Object.values(merged.palette.status)) if (!hexPattern.test(tone)) throw new TypeError("MossTheme status colors must be six-digit hex colors");
    for (const mode of ["dark", "light"]) for (const color of Object.values(merged.palette[mode].status || {})) if (!hexPattern.test(color)) throw new TypeError("Mode status colors must be six-digit hex colors");
    for (const color of merged.palette.data) if (!hexPattern.test(color)) throw new TypeError("MossTheme data colors must be six-digit hex colors");
    Object.assign(this, merged);
  }

  with(overrides = {}) { return new MossTheme(merge(this.toJSON(), overrides)); }
  toJSON() { return Object.fromEntries(Object.keys(DEFAULT_THEME).map((key) => [key, structuredClone(this[key])])); }
  validate({ minimumContrast = 4.5 } = {}) {
    const issues = [];
    for (const mode of ["dark", "light"]) {
      const palette = this.palette[mode];
      for (const surface of ["canvas", "surface", "surfaceRaised", "surfaceStrong"]) {
        const roles = { text: palette.text, textMuted: palette.textMuted, textFaint: palette.textFaint, primary: palette.primary, secondary: palette.secondary, ...this.palette.status, ...palette.status };
        for (const [foreground, color] of Object.entries(roles)) {
          const ratio = contrast(color, palette[surface]);
          if (ratio < minimumContrast) issues.push({ code: "contrast", mode, foreground, background: surface, ratio: Number(ratio.toFixed(2)), minimum: minimumContrast });
        }
      }
      const primaryRatio = contrast(palette.primary, palette.canvas);
      if (primaryRatio < 3) issues.push({ code: "non-text-contrast", mode, foreground: "primary", background: "canvas", ratio: Number(primaryRatio.toFixed(2)), minimum: 3 });
    }
    return { valid: issues.length === 0, issues };
  }
  save(key, storage = globalThis.localStorage) { if (!key || !storage) return this; storage.setItem(key, JSON.stringify(this.toJSON())); return this; }

  toVariables(mode = this.mode, density = this.density) {
    const resolvedMode = resolveMode(mode);
    const color = this.palette[resolvedMode];
    if (!color) throw new TypeError(`Palette is missing mode: ${resolvedMode}`);
    const result = {};
    for (const [key, name] of Object.entries(paletteVariables)) result[name] = color[key];
    result["--moss-accent"] = color.primary;
    result["--moss-accent-strong"] = color.primaryStrong;
    result["--moss-accent-surface"] = color.primarySurface;
    for (const tone of ["positive", "warning", "critical", "info"]) result[`--moss-${tone}`] = color.status?.[tone] || this.palette.status[tone];
    this.palette.data.forEach((value, index) => { result[`--moss-data-${index + 1}`] = value; });
    const selectedDensity = this.densityScale[density];
    if (!selectedDensity) throw new TypeError(`Unsupported Moss density: ${density}`);
    const sharpness = clamp(this.geometry.sharpness, 0, 1);
    const minRadius = rem(this.geometry.radiusMin);
    const maxRadius = Math.max(minRadius, rem(this.geometry.radiusMax));
    return Object.assign(result, {
      "--moss-font-sans": this.typography.sans, "--moss-font-heading": this.typography.heading, "--moss-font-display": this.typography.display, "--moss-font-mono": this.typography.mono,
      "--moss-display-weight": this.typography.displayWeight, "--moss-display-tracking": this.typography.displayTracking,
      "--moss-grain": this.texture.grain, "--moss-grain-size": this.texture.grainSize, "--moss-paper-tint": this.texture.paperTint,
      "--moss-font-size": this.typography.baseSize, "--moss-type-scale": this.typography.scale, "--moss-body-weight": this.typography.bodyWeight, "--moss-medium-weight": this.typography.mediumWeight,
      "--moss-heading-weight": this.typography.headingWeight, "--moss-heading-tracking": this.typography.headingTracking, "--moss-body-tracking": this.typography.bodyTracking,
      "--moss-line-height": this.typography.lineHeight, "--moss-heading-line-height": this.typography.headingLineHeight,
      "--moss-control-height": selectedDensity.control, "--moss-density-row": selectedDensity.row, "--moss-density-gap": selectedDensity.gap, "--moss-density-inset": selectedDensity.inset,
      "--moss-space-unit": this.spacing.unit, "--moss-section-gap": this.spacing.section, "--moss-page-inset": this.spacing.page, "--moss-content-max": this.spacing.contentMax,
      "--moss-sharpness": sharpness, "--moss-radius-sm": radius(minRadius, maxRadius, sharpness, .36), "--moss-radius-md": radius(minRadius, maxRadius, sharpness, .68), "--moss-radius-lg": radius(minRadius, maxRadius, sharpness, 1), "--moss-border-width": this.geometry.borderWidth,
      "--moss-shadow-surface": this.elevation.surface, "--moss-shadow-raised": this.elevation.raised, "--moss-shadow-overlay": this.elevation.overlay,
      "--moss-motion-fast": this.motion.fast, "--moss-motion-normal": this.motion.normal, "--moss-motion-slow": this.motion.slow, "--moss-ease": this.motion.ease, "--moss-motion-distance": this.motion.distance,
      "--moss-focus-width": this.interaction.focusWidth, "--moss-focus-opacity": this.interaction.focusOpacity, "--moss-hover-lift": this.interaction.hoverLift, "--moss-disabled-opacity": this.interaction.disabledOpacity, "--moss-target-min": this.interaction.targetMin,
      "--moss-rail-expanded": this.layout.railExpanded, "--moss-rail-collapsed": this.layout.railCollapsed, "--moss-topbar-height": this.layout.topbarHeight,
      "--moss-chart-stroke": this.charts.strokeWidth, "--moss-chart-grid-opacity": this.charts.gridOpacity, "--moss-chart-bar-radius": this.charts.barRadius, "--moss-chart-point-radius": this.charts.pointRadius, "--moss-chart-area-opacity": this.charts.areaOpacity
    });
  }

  apply(target = document.documentElement, options = {}) {
    const requestedMode = options.mode || this.mode;
    const density = options.density || this.density;
    const resolvedMode = resolveMode(requestedMode);
    for (const [name, value] of Object.entries(this.toVariables(requestedMode, density))) target.style.setProperty(name, String(value));
    target.dataset.mossTheme = resolvedMode;
    target.dataset.mossMode = requestedMode;
    target.dataset.mossDensity = density;
    target.dataset.mossThemeName = this.name;
    target.dataset.mossRailCollapsible = String(this.components.rail.collapsible);
    target.dataset.mossTableDensity = this.components.table.defaultDensity;
    target.style.setProperty("--moss-table-row", this.densityScale[this.components.table.defaultDensity]?.row || this.densityScale[density].row);
    return this;
  }

  static from(values = {}, overrides = {}) {
    if (typeof values === "string") throw new TypeError("MossTheme.from() accepts theme values, not named aesthetic presets");
    return new MossTheme(merge(values, overrides));
  }
  static load(key, storage = globalThis.localStorage) {
    if (!key || !storage) return null;
    const stored = storage.getItem(key);
    return stored ? new MossTheme(JSON.parse(stored)) : null;
  }
}

const createMossTheme = (values = {}) => new MossTheme(values);

export { MossTheme, createMossTheme, DEFAULT_THEME };
