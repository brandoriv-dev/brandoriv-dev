import { cartesianOption, formatValue, sourceFor } from "./shared.js";

const activityData = [
  { date: "2024-07-15", running: 450, swimming: 300 },
  { date: "2024-07-16", running: 380, swimming: 420 },
  { date: "2024-07-17", running: 520, swimming: 120 },
  { date: "2024-07-18", running: 140, swimming: 550 },
  { date: "2024-07-19", running: 600, swimming: 350 },
  { date: "2024-07-20", running: 480, swimming: 400 }
];
const activitySeries = [
  { key: "running", label: "Running" },
  { key: "swimming", label: "Swimming" }
];
const plainLabel = (value) => String(value ?? "").replace(/[{}]/g, "");
const numericValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
};
const dateLabel = (value, options) => {
  const date = new Date(String(value));
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date)
    : plainLabel(value);
};

function example(id, title, description, tooltip = {}) {
  return {
    id, family: "tooltip", title, description,
    summary: "Running and swimming calories from July 15 to 20, 2024; the combined total peaks at 950 on July 19.",
    source: sourceFor(id), xKey: "date",
    data: activityData.map((row) => ({ ...row })),
    series: activitySeries.map((series) => ({ ...series, ...(tooltip.icons ? { icon: "activity" } : {}) })),
    config: {
      chartType: "bar", stacked: true, axes: false, grid: false, legend: false,
      tooltip: { indicator: "dot", hideLabel: false, valueFormat: "number", ...tooltip }
    }
  };
}

export const examples = [
  example("chart-tooltip-advanced", "Tooltip - Advanced", "Activity calories with a combined total.", { hideLabel: true, total: true }),
  example("chart-tooltip-default", "Tooltip - Default", "Activity values for the selected day."),
  example("chart-tooltip-formatter", "Tooltip - Formatter", "Activity values expressed in kcal.", { hideLabel: true, indicator: "none" }),
  example("chart-tooltip-icons", "Tooltip - Icons", "Labeled activities with semantic icons.", { hideLabel: true, icons: true }),
  example("chart-tooltip-indicator-line", "Tooltip - Line Indicator", "Activity values with line indicators.", { indicator: "line" }),
  example("chart-tooltip-indicator-none", "Tooltip - No Indicator", "Activity values without indicators.", { indicator: "none" }),
  example("chart-tooltip-label-custom", "Tooltip - Custom Label", "Activity values under a shared category label.", { label: "Activities", indicator: "line" }),
  example("chart-tooltip-label-formatter", "Tooltip - Label Formatter", "Activity values with the full calendar date.", { labelFormat: "date" }),
  example("chart-tooltip-label-none", "Tooltip - No Label", "Activity values without a heading or indicators.", { hideLabel: true, indicator: "none" })
];

export function buildOption(model, context) {
  const config = model.config || {};
  const type = ["area", "bar", "line"].includes(config.chartType) ? config.chartType : "bar";
  const option = cartesianOption(model, context, type);
  const tooltip = config.tooltip || {};
  const calories = model.id === "chart-tooltip-advanced" || model.id === "chart-tooltip-formatter";
  const rich = option.tooltip.textStyle.rich;
  rich.heading = { color: context.text, fontFamily: context.font, fontWeight: "bold", lineHeight: 22 };
  rich.value = { color: context.text, fontFamily: context.font, fontWeight: "bold" };
  rich.unit = { color: context.muted, fontFamily: context.font };
  rich.total = { color: context.text, fontFamily: context.font, fontWeight: "bold", lineHeight: 24 };
  option.tooltip.textStyle.lineHeight = 20;
  option.tooltip.axisPointer.show = false;

  const category = config.horizontal ? option.yAxis : option.xAxis;
  if (model.xKey === "date") category.axisLabel.formatter = (value) => dateLabel(value, { weekday: "short" });
  if (type === "bar" && config.stacked && !config.normalized && option.series.length > 1) {
    option.series.forEach((series, index) => {
      series.itemStyle.borderRadius = index === 0
        ? (config.horizontal ? [4, 0, 0, 4] : [0, 0, 4, 4])
        : index === option.series.length - 1
          ? (config.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0])
          : [0, 0, 0, 0];
    });
  }

  // Extend the shared rich-text tooltip without evaluating host formatters.
  option.tooltip.formatter = (params) => {
    const entries = (Array.isArray(params) ? params : [params]).filter((item) => item && typeof item === "object");
    if (!entries.length) return "";
    const first = entries[0];
    let label = tooltip.label ?? first.axisValue ?? model.data[first.dataIndex]?.[model.xKey] ?? first.axisValueLabel ?? first.name ?? "";
    if (tooltip.labelFormat === "month") label = dateLabel(label, { month: "long" });
    if (tooltip.labelFormat === "date") {
      label = dateLabel(label, model.id === "chart-tooltip-label-formatter"
        ? { month: "long", day: "numeric", year: "numeric" }
        : { month: "short", day: "numeric" });
    }
    const lines = tooltip.hideLabel ? [] : [`{heading|${plainLabel(label)}}`];
    let total = 0;
    let count = 0;
    const unit = calories ? " {unit|kcal}" : "";
    for (const item of entries) {
      const index = Number.isInteger(item.seriesIndex) && model.series[item.seriesIndex] ? item.seriesIndex : 0;
      const definition = model.series[index];
      const value = numericValue(Array.isArray(item.value) ? item.value.at(-1) : item.value);
      if (value !== null) { total += value; count++; }
      const marker = tooltip.indicator === "none" && !tooltip.icons ? "" : `{marker${index}|}  `;
      const name = plainLabel(item.seriesName || definition.label || definition.key || item.name || "Value");
      lines.push(`${marker}${name}  {value|${formatValue(value, tooltip.valueFormat)}}${unit}`);
    }
    if (tooltip.total) lines.push(`{total|Total}  {value|${formatValue(count ? total : null, tooltip.valueFormat)}}${unit}`);
    return lines.join("\n");
  };
  return option;
}
