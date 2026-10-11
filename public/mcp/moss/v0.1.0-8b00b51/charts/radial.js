import { BROWSER_DATA, baseOption, formatValue, seriesColor, sourceFor } from "./shared.js";

const visitors = [{ key: "visitors", label: "Visitors" }];
const browserRows = () => BROWSER_DATA.map(({ browser, visitors }) => ({ browser, visitors }));

export const examples = [
  {
    id: "chart-radial-grid", family: "radial", title: "Radial Chart - Grid",
    description: "Visitors by browser from January to June",
    summary: "Chrome has the most visitors; circular grid lines compare browser totals.",
    xKey: "browser", data: browserRows(), series: visitors,
    config: { variant: "grid", max: 300 }
  },
  {
    id: "chart-radial-label", family: "radial", title: "Radial Chart - Label",
    description: "Visitors by browser from January to June",
    summary: "Each concentric track names its browser; Chrome has the most visitors.",
    xKey: "browser", data: browserRows(), series: visitors,
    config: { variant: "label", max: 300 }
  },
  {
    id: "chart-radial-shape", family: "radial", title: "Radial Chart - Shape",
    description: "Safari visitors against a target of 1,800",
    summary: "Safari has 1,260 visitors, 70 percent of the 1,800 visitor target.",
    xKey: "browser", data: [{ browser: "Safari", visitors: 1260 }], series: visitors,
    config: { variant: "shape", max: 1800, centerLabel: "Visitors" }
  },
  {
    id: "chart-radial-simple", family: "radial", title: "Radial Chart",
    description: "Visitors by browser from January to June",
    summary: "Chrome leads Safari, Firefox, Edge, and Other in visitor count.",
    xKey: "browser", data: browserRows(), series: visitors,
    config: { variant: "simple", max: 300 }
  },
  {
    id: "chart-radial-stacked", family: "radial", title: "Radial Chart - Stacked",
    description: "Desktop and mobile visitors in January",
    summary: "January has 1,830 visitors: 1,260 desktop and 570 mobile.",
    xKey: "month", data: [{ month: "January", desktop: 1260, mobile: 570 }],
    series: [{ key: "mobile", label: "Mobile" }, { key: "desktop", label: "Desktop" }],
    config: { variant: "stacked", max: 1830, centerLabel: "Visitors" }
  },
  {
    id: "chart-radial-text", family: "radial", title: "Radial Chart - Text",
    description: "Safari visitors from January to June",
    summary: "Safari has 200 visitors, shown inside a rounded 250-degree arc.",
    xKey: "browser", data: [{ browser: "Safari", visitors: 200 }], series: visitors,
    config: { variant: "text", max: 200, centerLabel: "Visitors" }
  }
].map((example) => ({ ...example, source: sourceFor(example.id) }));

function valueOf(value) {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function totalOf(values) {
  return values.reduce((sum, value) => Math.min(Number.MAX_VALUE, sum + value), 0);
}

function colorFor(series, index, context) {
  return seriesColor(series, index, context) || context.text;
}

function rowsFor(model, series) {
  if (!Array.isArray(model.data)) return [];
  return model.data.flatMap((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const values = series.map(({ key }) => valueOf(row[key]));
    if (values.every((value) => value === null)) return [];
    const name = typeof row[model.xKey] === "string" || typeof row[model.xKey] === "number"
      ? String(row[model.xKey]) : `Item ${index + 1}`;
    return [{ name, index, values }];
  });
}

function maximum(config, values) {
  return valueOf(config.max) || values.reduce((max, value) => Math.max(max, value), 1);
}

function centerText(total, label, context, semicircle) {
  const width = Math.max(40, Math.min(180, (context.width || 340) * 0.42));
  return [{
    type: "group", left: "center", top: semicircle ? "48%" : "43%", silent: true,
    children: [
      { type: "text", style: {
        text: formatValue(total), fill: context.text, fontFamily: context.font,
        fontSize: semicircle ? 26 : 32, fontWeight: 600, align: "center",
        width, overflow: "truncate"
      } },
      { type: "text", y: semicircle ? 32 : 38, style: {
        text: typeof label === "string" ? label : "Visitors", fill: context.muted,
        fontFamily: context.font, fontSize: 12, align: "center", width, overflow: "truncate"
      } }
    ]
  }];
}

function polarAxes(rows, context, { grid = false, stacked = false, labels = false, max }) {
  return {
    polar: { radius: stacked ? ["58%", "82%"] : ["24%", "88%"], center: ["50%", stacked ? "62%" : "50%"] },
    angleAxis: {
      type: "value", min: 0, max, startAngle: stacked ? 180 : labels ? -90 : 0,
      endAngle: stacked ? 0 : labels ? 380 : 360, clockwise: stacked,
      splitNumber: 4, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
      splitLine: { show: grid, lineStyle: { color: context.border } }
    },
    radiusAxis: {
      type: "category", data: rows.map(({ name }) => name),
      axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
      splitLine: { show: grid, lineStyle: { color: context.border } },
      splitArea: { show: false }
    }
  };
}

function singleOption(rows, series, config, context, shape) {
  const total = totalOf(rows.map(({ values }) => values[0] ?? 0));
  const colorIndex = BROWSER_DATA.findIndex(({ browser }) => browser === rows[0]?.name);
  const color = colorFor(series[0], colorIndex < 0 ? 0 : colorIndex, context);
  const gauge = {
    type: "gauge", name: series[0].label || series[0].key,
    center: ["50%", shape ? "62%" : "50%"], radius: shape ? "82%" : "72%",
    min: 0, max: maximum(config, [total]), startAngle: shape ? 180 : 0,
    endAngle: shape ? 0 : 250, clockwise: shape,
    pointer: { show: false }, anchor: { show: false }, axisTick: { show: false },
    splitLine: { show: false }, axisLabel: { show: false }, title: { show: false }, detail: { show: false },
    axisLine: { show: shape, lineStyle: { color: [[1, context.border]], width: shape ? 22 : 12 } },
    progress: { show: true, width: shape ? 22 : 12, roundCap: !shape, clip: true },
    itemStyle: { color }, emphasis: { itemStyle: { color } },
    data: rows.length ? [{ name: rows.length === 1 ? rows[0].name : series[0].label || series[0].key, value: total }] : []
  };
  const tracks = shape ? [] : [{
    ...gauge, silent: true, z: 0, startAngle: 0, endAngle: 360, clockwise: false,
    axisLine: { show: true, lineStyle: { color: [[1, context.border]], width: 12 } },
    progress: { show: false }, tooltip: { show: false }, data: []
  }];
  return {
    series: [...tracks, gauge],
    graphic: centerText(total, config.centerLabel, context, shape)
  };
}

export function buildOption(model = {}, context = {}) {
  model = model && typeof model === "object" ? model : {};
  const config = model.config && typeof model.config === "object" ? model.config : {};
  const series = Array.isArray(model.series)
    ? model.series.filter((item) => item && typeof item.key === "string" && item.key)
    : visitors;
  const rows = rowsFor(model, series);
  const option = baseOption({ ...model, config, series }, context);
  if (!series.length) return { ...option, series: [] };
  const variant = config.variant || (typeof model.id === "string" ? model.id.replace("chart-radial-", "") : "simple");
  if (variant === "shape" || variant === "text") {
    const single = singleOption(rows, series, config, context, variant === "shape");
    // A decorative track has no data and must not shift the tooltip's series identity.
    single.series.at(-1).tooltip = {
      formatter: (params) => option.tooltip.formatter({ ...params, seriesIndex: 0 })
    };
    return { ...option, ...single };
  }

  const stacked = variant === "stacked";
  const grid = variant === "grid";
  const labels = variant === "label";
  const rowTotals = rows.map(({ values }) => totalOf(values.map((value) => value ?? 0)));
  const max = maximum(config, stacked ? rowTotals : rows.map(({ values }) => values[0] ?? 0));
  const shownSeries = stacked ? series : series.slice(0, 1);
  return {
    ...option, ...polarAxes(rows, context, { stacked, grid, labels, max }),
    series: shownSeries.map((definition, seriesIndex) => ({
      type: "bar", coordinateSystem: "polar", name: definition.label || definition.key,
      stack: stacked ? "visitors" : undefined, roundCap: false,
      barCategoryGap: stacked ? "0%" : "20%", barGap: "0%",
      showBackground: !grid && !stacked, backgroundStyle: { color: context.border },
      label: {
        show: labels, position: "insideStart", distance: 4, rotate: 0,
        color: context.text, backgroundColor: context.surface, padding: [1, 3],
        fontFamily: context.font, fontSize: 11, width: 72, overflow: "truncate", formatter: "{b}"
      },
      emphasis: { focus: "self" },
      data: rows.map(({ name, index, values }) => ({
        name, value: values[seriesIndex], originalIndex: index,
        itemStyle: {
          color: colorFor(definition, stacked ? seriesIndex : index, context),
          borderRadius: stacked ? 5 : 0,
          borderColor: config.active && context.selectedIndex === index ? context.text : context.surface,
          borderWidth: config.active && context.selectedIndex === index ? 2 : stacked ? 2 : 0
        }
      }))
    })),
    graphic: stacked ? centerText(totalOf(rowTotals), config.centerLabel, context, true) : []
  };
}
