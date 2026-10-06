import { BROWSER_DATA, MONTH_DATA, baseOption, seriesColor, formatValue, sourceFor } from "./shared.js";

const browserSeries = [{ key: "visitors", label: "Visitors" }];
const monthData = MONTH_DATA.slice(0, 5).map((row) => ({ ...row, desktop: row.month === "April" ? 173 : row.desktop }));

function example(id, title, description, config, data = BROWSER_DATA, series = browserSeries, xKey = "browser") {
  return {
    id, family: "pie", title, description, xKey,
    summary: xKey === "browser"
      ? id === "chart-pie-donut-text" ? "Firefox leads with 287 visitors out of 1,125 total." : "Chrome leads with 275 visitors out of 925 total."
      : config.stacked
        ? "February leads desktop and mobile visits; desktop is the inner pie and mobile the outer ring."
        : "February has the most desktop visitors with 305; January is selected initially.",
    data: data.map((row) => ({ ...row })),
    series: series.map((item) => ({ ...item })),
    config, source: sourceFor(id),
  };
}

// Anatomy follows the pinned shadcn sources; MossTheme supplies every visual token.
export const examples = [
  example("chart-pie-donut-active", "Pie Chart - Donut Active", "A donut chart with an active sector", { donut: true, active: true }),
  example("chart-pie-donut-text", "Pie Chart - Donut with Text", "A donut chart with a visitor total", { donut: true, centerText: "total" },
    BROWSER_DATA.map((row) => ({ ...row, visitors: row.browser === "Firefox" ? 287 : row.browser === "Other" ? 190 : row.visitors }))),
  example("chart-pie-donut", "Pie Chart - Donut", "Visitors by browser", { donut: true }),
  example("chart-pie-interactive", "Pie Chart - Interactive", "Select a month to inspect desktop visitors", { donut: true, active: true, activeRing: true, centerText: "selected", interactive: "slice" },
    monthData, [{ key: "desktop", label: "Desktop" }], "month"),
  example("chart-pie-label-custom", "Pie Chart - Custom Label", "Visitor counts without leader lines", { labels: "custom" }),
  example("chart-pie-label-list", "Pie Chart - Label List", "Browser names inside their slices", { labels: "list" }),
  example("chart-pie-label", "Pie Chart - Label", "Visitor counts with leader lines", { labels: "value" }),
  example("chart-pie-legend", "Pie Chart - Legend", "Browser categories in a paged legend", { legend: true, tooltip: false }),
  example("chart-pie-separator-none", "Pie Chart - Separator None", "Contiguous browser slices", { separator: false }),
  example("chart-pie-simple", "Pie Chart", "Visitors by browser", {}),
  example("chart-pie-stacked", "Pie Chart - Stacked", "Desktop visits inside, mobile visits outside", { stacked: true },
    monthData, [{ key: "desktop", label: "Desktop" }, { key: "mobile", label: "Mobile" }], "month"),
];

function sliceName(row, key, index) {
  const name = row?.[key];
  if (typeof name !== "string" && typeof name !== "number") return `Item ${index + 1}`;
  const text = String(name);
  return text || `Item ${index + 1}`;
}

const plainText = (value) => String(value ?? "").replace(/[{}]/g, "");

function numericValue(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function centerValue(value) {
  const text = formatValue(value);
  return text.length > 12 ? value.toExponential(2) : text;
}

function totalText(data) {
  const total = data.reduce((sum, item) => sum + item.rawValue, 0);
  if (Number.isFinite(total)) return centerValue(total);
  const maximum = data.reduce((value, item) => Math.max(value, item.rawValue), 0);
  let exponent = Math.floor(Math.log10(maximum));
  let coefficient = maximum / 10 ** exponent * data.reduce((sum, item) => sum + item.value, 0);
  const shift = Math.floor(Math.log10(coefficient));
  exponent += shift;
  coefficient /= 10 ** shift;
  return `${formatValue(coefficient)}e+${exponent}`;
}

function tooltipText(params) {
  const item = Array.isArray(params) ? params[0] : params;
  if (!item) return "";
  return `${plainText(item.seriesName)}\n${plainText(item.name)}: ${formatValue(item.data?.rawValue ?? numericValue(item.value))}`;
}

function pieLabel(mode, context, width) {
  const outside = mode === "value" || mode === "custom";
  return {
    show: Boolean(mode),
    position: outside ? "outside" : "inside",
    color: context.text,
    fontFamily: context.font,
    fontSize: 12,
    formatter: (params) => mode === "list" ? plainText(params.name) : formatValue(params.data.rawValue),
    overflow: "truncate",
    width: mode === "list" ? Math.min(48, width * 0.16) : Math.min(88, width * 0.22),
    alignTo: "edge",
    edgeDistance: 8,
    bleedMargin: 4,
    distanceToLabelLine: 4,
    ...(mode === "list" ? { backgroundColor: context.surface, padding: [2, 2], borderRadius: 2 } : {}),
  };
}

export function buildOption(model, context) {
  const option = baseOption(model, context);
  const config = model.config ?? {};
  const rows = Array.isArray(model.data) ? model.data : [];
  const definitions = Array.isArray(model.series) && model.series.length ? model.series : browserSeries;
  const width = Number.isFinite(context.width) && context.width > 0 ? context.width : 340;
  const outsideLabels = config.labels === "value" || config.labels === "custom";
  const active = Boolean(config.active || config.interactive === "slice");
  const donut = Boolean(config.donut || active || config.centerText);
  const center = ["50%", config.legend ? "44%" : "50%"];
  const outer = active ? 66 : outsideLabels ? 58 : config.legend ? 68 : 76;
  const inner = donut ? 44 : 0;
  const requestedIndex = Number.isInteger(context.selectedIndex) ? context.selectedIndex : 0;
  const selectedIndex = requestedIndex >= 0 && requestedIndex < rows.length ? requestedIndex : 0;
  const borderWidth = config.separator === false ? 0 : active || config.centerText ? 4 : 2;

  option.tooltip = {
    ...option.tooltip,
    show: config.tooltip !== false,
    textStyle: { color: context.text, fontFamily: context.font },
    formatter: tooltipText,
  };
  option.legend = config.legend ? {
    show: true,
    type: "scroll",
    orient: "horizontal",
    left: 8, right: 8, bottom: 0,
    data: rows.map((row, index) => sliceName(row, model.xKey, index)),
    formatter: plainText,
    itemWidth: 10, itemHeight: 10, itemGap: 12,
    textStyle: { color: context.text, fontFamily: context.font, fontSize: 12, width: Math.min(112, width * 0.3), overflow: "truncate" },
    pageIconColor: context.text,
    pageIconInactiveColor: context.border,
    pageTextStyle: { color: context.muted, fontFamily: context.font },
    pageFormatter: "{current}/{total}",
    pageButtonItemGap: 4,
    pageIconSize: 12,
    selectedMode: false,
    tooltip: { show: true, renderMode: "richText", confine: true, formatter: (params) => plainText(params.name), textStyle: { color: context.text, fontFamily: context.font }, backgroundColor: context.surface, borderColor: context.border },
  } : { show: false };

  option.series = definitions.slice(0, config.stacked ? definitions.length : 1).map((definition, seriesIndex, series) => {
    const values = rows.map((row) => numericValue(row?.[definition.key]));
    const total = values.reduce((sum, value) => sum + value, 0);
    // Scaling only overflowing totals keeps ECharts angles finite without losing exact tooltip values.
    const scale = Number.isFinite(total) ? 1 : values.reduce((maximum, value) => Math.max(maximum, value), 0);
    const radius = config.stacked
      ? seriesIndex === 0 ? [0, "50%"] : [`${54 + (seriesIndex - 1) * 26 / (series.length - 1)}%`, `${54 + seriesIndex * 26 / (series.length - 1) - 2}%`]
      : [`${inner}%`, `${outer}%`];
    return {
      id: definition.key,
      type: "pie",
      name: definition.label ?? definition.key,
      center, radius,
      clockwise: false,
      startAngle: 0,
      stillShowZeroSum: false,
      showEmptyCircle: false,
      selectedMode: false,
      selectedOffset: 0,
      avoidLabelOverlap: true,
      minShowLabelAngle: config.labels === "list" ? 12 : 0,
      labelLayout: { hideOverlap: true },
      label: pieLabel(config.labels, context, width),
      labelLine: { show: config.labels === "value", length: 10, length2: 8, lineStyle: { color: context.border } },
      itemStyle: { borderColor: context.surface, borderWidth, borderRadius: 0 },
      emphasis: { scale: false, label: { show: Boolean(config.labels) } },
      data: rows.map((row, index) => ({
        name: sliceName(row, model.xKey, index),
        value: values[index] / scale,
        rawValue: values[index],
        itemStyle: { color: seriesColor(definition, index, context), opacity: active && !config.stacked && index === selectedIndex ? 0 : 1 },
        label: { show: Boolean(config.labels) && values[index] > 0 },
        labelLine: { show: config.labels === "value" && values[index] > 0 },
      })),
    };
  });

  if (active && !config.stacked && rows.length) {
    const main = option.series[0];
    const activeData = main.data.map((item, index) => ({
      ...item,
      itemStyle: { ...item.itemStyle, opacity: index === selectedIndex ? 1 : 0 },
      label: { show: false }, labelLine: { show: false },
    }));
    option.series.push({
      ...main,
      id: `${main.id}-active`,
      radius: [`${inner}%`, `${outer + 8}%`],
      z: 3,
      silent: true,
      tooltip: { show: false },
      label: { show: false }, labelLine: { show: false },
      data: activeData,
    });
    if (config.activeRing) {
      option.series.push({
        ...main,
        id: `${main.id}-ring`,
        radius: [`${outer + 10}%`, `${outer + 20}%`],
        z: 4,
        silent: true,
        tooltip: { show: false },
        label: { show: false }, labelLine: { show: false },
        data: activeData,
      });
    }
  }

  if (config.centerText) {
    const data = option.series[0]?.data ?? [];
    const text = config.centerText === "selected" ? centerValue(data[selectedIndex]?.rawValue ?? 0) : totalText(data);
    const textWidth = Math.min(112, width * 0.34);
    option.title = {
      text,
      subtext: "Visitors",
      left: "center", top: "middle",
      padding: 0, itemGap: 4,
      textStyle: { color: context.text, fontFamily: context.font, fontSize: Math.min(28, textWidth / (text.length * 0.65)), fontWeight: 600, width: textWidth, overflow: "truncate" },
      subtextStyle: { color: context.muted, fontFamily: context.font, fontSize: 12 },
      triggerEvent: false,
    };
  }
  return option;
}
