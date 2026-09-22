const DEFAULT_THEME = {
  name: "Moss", mode: "dark", density: "balanced",
  palette: {
    dark: { canvas: "#191b19", surface: "#222522", surfaceRaised: "#292d29", surfaceStrong: "#303530", text: "#f4f2e9", textMuted: "#afb5ad", textFaint: "#7e887f", border: "#3b403b", borderSoft: "#303430", primary: "#74d69b", primaryStrong: "#9be9b8", primarySurface: "#254a34", secondary: "#7fa9ff", secondaryStrong: "#a9c4ff", secondarySurface: "#253855" },
    light: { canvas: "#f4f4ef", surface: "#ffffff", surfaceRaised: "#eceee9", surfaceStrong: "#e2e5df", text: "#1d221e", textMuted: "#59635b", textFaint: "#78827a", border: "#cbd1ca", borderSoft: "#dde1dc", primary: "#247a4c", primaryStrong: "#165f39", primarySurface: "#d9eee1", secondary: "#285fae", secondaryStrong: "#174983", secondarySurface: "#dce8fa" },
    status: { positive: "#43a86d", warning: "#c88b20", critical: "#d45d48", info: "#4f82d2" },
    data: ["#4f82d2", "#43a86d", "#8a72d6", "#c88b20", "#d45d48"]
  },
  typography: { sans: '"Manrope", "DM Sans", ui-sans-serif, system-ui, sans-serif', heading: "var(--moss-font-sans)", mono: '"DM Mono", "SFMono-Regular", Consolas, monospace', baseSize: "1rem", scale: 1.2, bodyWeight: "400", mediumWeight: "500", headingWeight: "600", headingTracking: "-.035em", bodyTracking: "0", lineHeight: 1.5, headingLineHeight: 1.12 },
  densityScale: {
    comfortable: { control: "2.75rem", row: "3.5rem", gap: "1rem", inset: "1rem" },
    balanced: { control: "2.375rem", row: "2.625rem", gap: ".75rem", inset: ".75rem" },
    compact: { control: "2rem", row: "2rem", gap: ".5rem", inset: ".625rem" }
  },
  spacing: { unit: ".25rem", section: "2rem", page: "clamp(1rem, 3vw, 2.5rem)", contentMax: "90rem" },
  geometry: { sharpness: 0.55, radiusMin: ".125rem", radiusMax: "1rem", borderWidth: "1px", controlShape: "rectangular" },
  elevation: { surface: "none", raised: "0 .5rem 1.5rem rgb(0 0 0 / .16)", overlay: "0 1.25rem 3.75rem rgb(0 0 0 / .38)" },
  motion: { fast: "140ms", normal: "220ms", slow: "360ms", ease: "cubic-bezier(.2,.8,.2,1)", distance: ".25rem" },
  interaction: { focusWidth: "3px", focusOpacity: "26%", hoverLift: "-1px", disabledOpacity: ".48", targetMin: "2.75rem" },
  layout: { railExpanded: "15rem", railCollapsed: "4.75rem", topbarHeight: "4rem", contentMax: "90rem" },
  charts: { strokeWidth: "2.5", gridOpacity: ".18", barRadius: "0", pointRadius: "3", areaOpacity: ".14" },
  components: { rail: { collapsible: true, collapsedTooltips: true }, table: { defaultDensity: "compact" }, button: { emphasis: "precise" } }
};

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const merge = (base, override = {}) => Object.fromEntries(Object.keys({ ...base, ...override }).map((key) => [key, isObject(base?.[key]) && isObject(override?.[key]) ? merge(base[key], override[key]) : (override?.[key] ?? base?.[key])]));
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));
const rem = (value) => Number.parseFloat(value) || 0;
const radius = (min, max, sharpness, position) => `${min + (max - min) * (1 - sharpness) * position}rem`;
const paletteVariables = { canvas: "--moss-canvas", surface: "--moss-surface", surfaceRaised: "--moss-surface-raised", surfaceStrong: "--moss-surface-strong", text: "--moss-text", textMuted: "--moss-text-muted", textFaint: "--moss-text-faint", border: "--moss-border", borderSoft: "--moss-border-soft", primary: "--moss-primary", primaryStrong: "--moss-primary-strong", primarySurface: "--moss-primary-surface", secondary: "--moss-secondary", secondaryStrong: "--moss-secondary-strong", secondarySurface: "--moss-secondary-surface" };
const resolveMode = (mode) => mode === "system" ? (globalThis.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark") : mode;

class MossTheme {
  constructor(values = {}) {
    const merged = merge(DEFAULT_THEME, values);
    if (!["light", "dark", "system"].includes(merged.mode)) throw new TypeError(`Unsupported Moss mode: ${merged.mode}`);
    if (!merged.densityScale[merged.density]) throw new TypeError(`Unsupported Moss density: ${merged.density}`);
    if (!Array.isArray(merged.palette.data) || merged.palette.data.length < 2) throw new TypeError("MossTheme requires at least two data colors");
    Object.assign(this, merged);
  }

  with(overrides = {}) { return new MossTheme(merge(this.toJSON(), overrides)); }
  toJSON() { return Object.fromEntries(Object.keys(DEFAULT_THEME).map((key) => [key, structuredClone(this[key])])); }

  toVariables(mode = this.mode, density = this.density) {
    const resolvedMode = resolveMode(mode);
    const color = this.palette[resolvedMode];
    if (!color) throw new TypeError(`Palette is missing mode: ${resolvedMode}`);
    const result = {};
    for (const [key, name] of Object.entries(paletteVariables)) result[name] = color[key];
    result["--moss-accent"] = color.primary;
    result["--moss-accent-strong"] = color.primaryStrong;
    result["--moss-accent-surface"] = color.primarySurface;
    for (const tone of ["positive", "warning", "critical", "info"]) result[`--moss-${tone}`] = this.palette.status[tone];
    this.palette.data.forEach((value, index) => { result[`--moss-data-${index + 1}`] = value; });
    const selectedDensity = this.densityScale[density];
    if (!selectedDensity) throw new TypeError(`Unsupported Moss density: ${density}`);
    const sharpness = clamp(this.geometry.sharpness, 0, 1);
    const minRadius = rem(this.geometry.radiusMin);
    const maxRadius = Math.max(minRadius, rem(this.geometry.radiusMax));
    return Object.assign(result, {
      "--moss-font-sans": this.typography.sans, "--moss-font-heading": this.typography.heading, "--moss-font-mono": this.typography.mono,
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
    return this;
  }

  static from(values = {}, overrides = {}) {
    if (typeof values === "string") throw new TypeError("MossTheme.from() accepts theme values, not named aesthetic presets");
    return new MossTheme(merge(values, overrides));
  }
}

const createMossTheme = (values = {}) => new MossTheme(values);

const MossElement = globalThis.HTMLElement ?? class {};
class MossThemeProvider extends MossElement {
  static observedAttributes = ["mode", "density"];
  connectedCallback() { this.renderTheme(); }
  attributeChangedCallback() { if (this.isConnected) this.renderTheme(); }
  set value(theme) { this._value = theme instanceof MossTheme ? theme : createMossTheme(theme); this.renderTheme(); }
  get value() { return this._value; }
  renderTheme() {
    const options = { mode: this.getAttribute("mode") || undefined, density: this.getAttribute("density") || undefined };
    (this._value || createMossTheme()).apply(this, options);
  }
}

if (globalThis.customElements && !customElements.get("moss-theme-provider")) customElements.define("moss-theme-provider", MossThemeProvider);
export { MossTheme, MossThemeProvider, createMossTheme, DEFAULT_THEME };
