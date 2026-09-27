import { MONTH_DATA, baseOption, seriesColor, formatValue, sourceFor, iconImage } from "./shared.js";

const desktop = { key: "desktop", label: "Desktop", icon: "service" };
const mobile = { key: "mobile", label: "Mobile", icon: "connect" };
const singleData = MONTH_DATA.map((row, index) => ({ month: row.month, desktop: [186, 305, 237, 273, 209, 214][index] }));
const filledData = singleData.map((row, index) => ({ ...row, desktop: [186, 285, 237, 203, 209, 264][index] }));
const noSpokesData = singleData.map((row, index) => ({ ...row, desktop: index === 3 ? 203 : row.desktop }));
const multipleData = MONTH_DATA.map((row) => ({ ...row }));
const linesData = MONTH_DATA.map((row, index) => ({
  month: row.month, desktop: [186, 185, 207, 173, 160, 174][index], mobile: [160, 170, 180, 160, 190, 204][index]
}));

function example(id, title, config = {}, data = singleData, series = [desktop]) {
  return {
    id: `chart-radar-${id}`, family: "radar", title: `Radar Chart${title ? ` - ${title}` : ""}`,
    description: "Showing total visitors for the last 6 months",
    summary: series.length === 1 ? "Desktop visits peaked in February." : "Desktop and mobile visits vary across January to June.",
    source: sourceFor(`chart-radar-${id}`), xKey: "month",
    data: data.map((row) => ({ ...row })), series: series.map((item) => ({ ...item })),
    config: { grid: "polygon", spokes: true, fillOpacity: 0.6, ...config }
  };
}

// Anatomy and sample values follow the inventory's pinned upstream TSX sources.
export const examples = [
  example("default", ""),
  example("dots", "Dots", { dots: true }),
  example("grid-circle-fill", "Grid Circle Filled", { grid: "circle", gridFill: true, fillOpacity: 0.5 }, filledData),
  example("grid-circle-no-lines", "Grid Circle - No Lines", { grid: "circle", spokes: false, dots: true, tooltip: { hideLabel: true } }, noSpokesData),
  example("grid-circle", "Grid Circle", { grid: "circle", dots: true, tooltip: { hideLabel: true } }),
  example("grid-custom", "Grid Custom", { spokes: false, customGrid: true, tooltip: { hideLabel: true } }),
  example("grid-fill", "Grid Filled", { gridFill: true, fillOpacity: 0.5, tooltip: { hideLabel: true } }, filledData),
  example("grid-none", "Grid None", { grid: "none", dots: true, tooltip: { hideLabel: true } }),
  example("icons", "Icons", { icons: true, legend: true, tooltip: { indicator: "line", icons: true } }, multipleData, [desktop, mobile]),
  example("label-custom", "Custom Label", { labels: "custom", tooltip: { indicator: "line" } }, multipleData, [desktop, mobile]),
  example("legend", "Legend", { legend: true, tooltip: { indicator: "line" } }, multipleData, [desktop, mobile]),
  example("lines-only", "Lines Only", { linesOnly: true, spokes: false, tooltip: { indicator: "line" } }, linesData, [desktop, mobile]),
  example("multiple", "Multiple", { tooltip: { indicator: "line" } }, multipleData, [desktop, mobile]),
  example("radius", "Radius Axis", { radiusAxis: true, tooltip: { indicator: "line" } }, multipleData, [desktop, mobile])
];

function plainText(value) {
  return String(value ?? "").replace(/[{}\r\n]/g, " ");
}

/**
 * Narrow surfaces abbreviate month names and reserve more room for value labels.
 * Empty data draws no series. Partial rows stay in the host's exact-data table;
 * only complete comparisons are plotted, since ECharts places missing radar
 * values at the center. One/two-axis data uses dots and no misleading area.
 * Loading/error/disabled states and keyboard data access belong to the renderer.
 */
export function buildOption(model, context) {
  const config = model.config || {};
  const narrow = context.width < 360;
  const compact = context.width < 240;
  const data = Array.isArray(model.data) ? model.data.filter((row) => row && typeof row === "object") : [];
  const series = (Array.isArray(model.series) ? model.series : []).filter((item) =>
    item && typeof item.key === "string" && data.some((row) => Number.isFinite(row[item.key]))
  );
  const rows = series.length ? data.filter((row) => series.every((item) => Number.isFinite(row[item.key]))) : [];
  const labels = rows.map((row, index) => plainText(row[model.xKey || "month"] ?? `Item ${index + 1}`));
  const names = series.map((item) => plainText(item.label || item.key));
  const colors = series.map((item) => seriesColor(item, model.series.indexOf(item), context));
  const legendLabelWidth = compact ? 48 : narrow ? 80 : 140;
  const legendWidth = Math.max(0, context.width - 24);
  const legendContentWidth = names.reduce((width, name) => width + Math.min(legendLabelWidth, name.length * 7) + 14, 0) + Math.max(0, names.length - 1) * 16;
  const scrollLegend = legendContentWidth > legendWidth;
  let min = 0;
  let max = 1;
  for (const row of rows) {
    for (const item of series) {
      min = Math.min(min, row[item.key]);
      max = Math.max(max, row[item.key]);
    }
  }
  const step = 10 ** Math.floor(Math.log10((max - min) / 5));
  const interval = Math.ceil((max - min) / 5 / step) * step;
  min = Math.floor(min / interval) * interval;
  max = Math.ceil(max / interval) * interval;
  const categoryLabel = (name) => {
    if (narrow && MONTH_DATA.some((row) => row.month === name)) return name.slice(0, 3);
    const limit = compact ? 7 : narrow ? 10 : 18;
    return name.length > limit ? `${name.slice(0, limit - 3)}...` : name;
  };
  const axisLabel = (name, indicator) => {
    const index = indicator.rowIndex;
    if (config.labels !== "custom") return categoryLabel(name);
    const values = series.map((item) => {
      const value = rows[index][item.key];
      const label = narrow && Math.abs(value) >= 1000
        ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
        : formatValue(value);
      return `{value|${label}}`;
    });
    return `${values.join("{separator| / }")}\n{month|${categoryLabel(name)}}`;
  };
  const radius = config.labels === "custom" ? (compact ? "40%" : narrow ? "48%" : "58%") : compact ? "48%" : narrow ? "58%" : "65%";
  const radar = {
    center: ["50%", config.legend ? "43%" : "50%"], radius,
    startAngle: 90, clockwise: false, shape: config.grid === "circle" ? "circle" : "polygon",
    splitNumber: config.customGrid ? 1 : 5,
    indicator: rows.map((row, index) => ({ name: labels[index], rowIndex: index, min, max, color: context.muted })),
    axisNameGap: config.labels === "custom" ? 10 : 8,
    axisName: {
      show: !config.radiusAxis, color: context.muted, fontFamily: context.font, fontSize: 12,
      formatter: axisLabel,
      rich: {
        value: { color: context.text, fontFamily: context.font, fontSize: 12, fontWeight: 500, lineHeight: 17 },
        separator: { color: context.muted, fontFamily: context.font, fontSize: 12 },
        month: { color: context.muted, fontFamily: context.font, fontSize: 12, lineHeight: 17 }
      }
    },
    axisLine: { show: config.grid !== "none" && config.spokes !== false, lineStyle: { color: context.border, width: 1 } },
    axisTick: { show: false, lineStyle: { color: context.border } },
    axisLabel: { show: false, color: context.text, fontFamily: context.font },
    splitLine: { show: config.grid !== "none", lineStyle: { color: context.border, width: 1, opacity: config.gridFill ? 0.2 : 1 } },
    splitArea: { show: !!config.gridFill && config.grid !== "none", areaStyle: { color: [colors[0] || context.border], opacity: 0.2 } }
  };
  const option = {
    ...baseOption(model, context), radar,
    legend: {
      show: !!config.legend && rows.length > 0, type: scrollLegend ? "scroll" : "plain", selectedMode: false,
      left: "center", bottom: 0, width: legendWidth,
      itemWidth: 14, itemHeight: 14, itemGap: 16,
      textStyle: { color: context.text, fontFamily: context.font, fontSize: 12, width: legendLabelWidth, overflow: "truncate" },
      inactiveColor: context.muted, inactiveBorderColor: context.border,
      pageIconColor: context.text, pageIconInactiveColor: context.muted,
      pageTextStyle: { color: context.muted, fontFamily: context.font },
      ...(scrollLegend && config.legend ? { pageIcons: { horizontal: [
        `image://${iconImage("collapse-rail", context.text)}`, `image://${iconImage("expand-rail", context.text)}`
      ] } } : {}),
      data: series.map((item, index) => {
        const image = config.icons ? iconImage(item.icon, colors[index]) : "";
        return { name: names[index], icon: image ? `image://${image}` : "rect", itemStyle: { color: colors[index], borderColor: colors[index] } };
      })
    },
    tooltip: {
      trigger: "item", renderMode: "richText", confine: true,
      backgroundColor: context.surface, borderColor: context.border, borderWidth: 1,
      textStyle: { color: context.text, fontFamily: context.font, fontSize: 12 },
      shadowBlur: 0, shadowColor: context.surface,
      formatter: (params) => {
        const entry = Array.isArray(params) ? params[0] : params;
        if (!entry) return "";
        const index = series.findIndex((item) => item.key === entry.seriesId);
        const active = index < 0 ? (entry.seriesIndex || 0) : index;
        if (!series[active]) return "";
        const lines = config.tooltip?.hideLabel ? [] : [names[active]];
        for (let index = 0; index < rows.length; index++) {
          lines.push(`${plainText(labels[index])}: ${formatValue(rows[index][series[active].key], config.tooltip?.valueFormat)}`);
        }
        // ECharts pre-registers the rich-text marker supplied with event params.
        return `${config.tooltip?.indicator === "none" ? "" : entry.marker || ""}${lines.join("\n")}`;
      }
    },
    series: series.map((item, index) => {
      const opacity = config.linesOnly || rows.length < 3 ? 0 : index === 0 ? (config.fillOpacity ?? 0.6) : 0.3;
      const style = { color: colors[index], borderColor: colors[index] };
      return {
        id: item.key, name: names[index], type: "radar", radarIndex: 0,
        symbol: config.dots || rows.length < 3 ? "circle" : "none", symbolSize: config.dots ? 8 : 6,
        lineStyle: { color: colors[index], width: config.linesOnly ? 2 : 0 },
        areaStyle: { color: colors[index], opacity }, itemStyle: style,
        label: { show: false, color: context.text, fontFamily: context.font },
        emphasis: { lineStyle: { color: colors[index], width: config.linesOnly ? 2 : 0 }, areaStyle: { color: colors[index], opacity }, itemStyle: style },
        blur: { lineStyle: { color: colors[index] }, areaStyle: { color: colors[index] }, itemStyle: style },
        select: { lineStyle: { color: colors[index] }, areaStyle: { color: colors[index] }, itemStyle: style },
        data: rows.length ? [{ name: names[index], value: rows.map((row) => row[item.key]) }] : []
      };
    })
  };
  if (config.radiusAxis) {
    // A second native radar axis places one scale at 60 degrees without rotating
    // the data polygon or repeating the scale on all six spokes.
    option.radar = [radar, {
      ...radar, startAngle: 60, axisName: { ...radar.axisName, show: false },
      axisLine: { ...radar.axisLine, show: false }, splitLine: { ...radar.splitLine, show: false },
      splitArea: { ...radar.splitArea, show: false },
      indicator: radar.indicator.map((item, index) => ({ ...item, axisLabel: {
        show: index === 0, hideOverlap: true, showMinLabel: true, showMaxLabel: true,
        color: context.text, fontFamily: context.font, fontSize: 12,
        margin: 4, formatter: (value) => formatValue(value)
      } }))
    }];
  }
  return option;
}
