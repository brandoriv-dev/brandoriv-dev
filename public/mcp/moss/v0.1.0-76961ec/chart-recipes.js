import * as area from "./charts/area.js";
import * as bar from "./charts/bar.js";
import * as line from "./charts/line.js";
import * as pie from "./charts/pie.js";
import * as radar from "./charts/radar.js";
import * as radial from "./charts/radial.js";
import * as tooltip from "./charts/tooltip.js";
import { createShadcnTheme } from "./presets/shadcn.js";

const families = { area, bar, line, pie, radar, radial, tooltip };
const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
export const chartFamilies = Object.freeze(Object.keys(families));
export const chartExamples = freeze(Object.values(families).flatMap((family) => family.examples));
const byId = new Map(chartExamples.map((example) => [example.id, example]));
export const getChartExample = (id) => byId.has(id) ? structuredClone(byId.get(id)) : null;

export function prepareChartModel(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Chart configuration must be an object.");
  if (!families[input.family]) throw new TypeError(`Unsupported chart family: ${input.family || "missing"}.`);
  if (!Array.isArray(input.data)) throw new TypeError("Chart data must be an array of records.");
  if (!Array.isArray(input.series) || !input.series.length) throw new TypeError("A chart needs at least one series.");
  if (typeof input.xKey !== "string" || !input.xKey) throw new TypeError("A chart needs a category key (xKey).");
  const keys = new Set();
  for (const series of input.series) {
    if (!series || typeof series.key !== "string" || !series.key || keys.has(series.key)) throw new TypeError("Chart series keys must be nonempty and unique.");
    keys.add(series.key);
  }
  let partial = false;
  let numericValues = 0;
  const data = input.data.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new TypeError("Each chart row must be a record.");
    const normalized = { ...row, [input.xKey]: String(row[input.xKey] ?? "Unlabelled") };
    if (row[input.xKey] === undefined || row[input.xKey] === null) partial = true;
    for (const key of keys) {
      const value = row[key];
      const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
      normalized[key] = Number.isFinite(number) ? number : null;
      if (normalized[key] === null) partial = true;
      else numericValues++;
    }
    return normalized;
  });
  const config = input.config ?? {};
  if (typeof config !== "object" || Array.isArray(config)) throw new TypeError("Chart options must be a record.");
  return { model: { ...input, data, series: input.series.map((series) => ({ ...series })), config: { ...config } }, partial, empty: numericValues === 0 };
}

export function chartContext(theme = createShadcnTheme(), mode = "light") {
  const values = theme.toVariables(mode);
  return {
    palette: theme.palette.data.slice(), text: values["--moss-text"], muted: values["--moss-text-muted"],
    border: values["--moss-border"], surface: values["--moss-surface"], font: values["--moss-font-sans"],
    width: 640, motion: false, selectedIndex: 0, selection: null
  };
}

export function buildChartOption(input, overrides = {}) {
  const { model } = prepareChartModel(input);
  const context = { ...chartContext(), ...overrides };
  if (!Array.isArray(context.palette) || !context.palette.length) throw new TypeError("Chart context needs data colors.");
  return families[model.family].buildOption(model, context);
}
