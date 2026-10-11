import { iconMarkup, getIconPack, registerIconPack } from "../icons.js";
import { iconoir } from "../icon-packs/iconoir.js";

export const MONTH_DATA = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];
export const DAILY_DATA = Array.from({ length: 90 }, (_, index) => ({
  date: new Date(Date.UTC(2024, 5, 1 + index)).toISOString().slice(0, 10),
  desktop: Math.round(220 + Math.sin(index * .71) * 95 + (index % 7) * 16),
  mobile: Math.round(175 + Math.cos(index * .53) * 75 + (index % 5) * 12)
}));
export const BROWSER_DATA = [
  { browser: "Chrome", visitors: 275 }, { browser: "Safari", visitors: 200 },
  { browser: "Firefox", visitors: 187 }, { browser: "Edge", visitors: 173 },
  { browser: "Other", visitors: 90 }
];

export const sourceFor = (id) => `https://github.com/shadcn-ui/ui/blob/d82b4a7d98430da156d6a8ad6973c87279a0c5e3/apps/v4/registry/new-york-v4/charts/${id}.tsx`;
export const formatValue = (value, format = "number") => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "No data";
  const number = Number(value);
  if (format === "currency") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(number);
  if (format === "percent") return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(number)}%`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(number);
};
export const seriesColor = (series, index, context) => series?.color || context.palette[index % context.palette.length];

export function iconImage(name, color) {
  if (!getIconPack()) registerIconPack(iconoir);
  const markup = iconMarkup(name).replaceAll("currentColor", color || "#737373");
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

const plainLabel = (value) => String(value ?? "").replace(/[{}]/g, "");
const dateLabel = (value, format) => {
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) return plainLabel(value);
  return new Intl.DateTimeFormat("en-US", { month: format === "month" ? "long" : "short", ...(format === "month" ? {} : { day: "numeric" }), timeZone: "UTC" }).format(date);
};

export function tooltipOption(model, context) {
  const config = model.config?.tooltip || {};
  const rich = {};
  const rows = model.series || [];
  rows.forEach((series, index) => {
    const color = seriesColor(series, index, context);
    rich[`marker${index}`] = config.icons && series.icon
      ? { width: 12, height: 12, backgroundColor: { image: iconImage(series.icon, color) } }
      : { width: config.indicator === "line" ? 3 : 8, height: config.indicator === "line" ? 12 : 8, borderRadius: config.indicator === "line" ? 0 : 2, backgroundColor: color };
  });
  return {
    trigger: ["pie", "radial", "radar"].includes(model.family) ? "item" : "axis",
    renderMode: "richText", confine: true, backgroundColor: context.surface,
    borderColor: context.border, borderWidth: 1, padding: [10, 12],
    textStyle: { color: context.text, fontFamily: context.font, fontSize: 12, rich },
    axisPointer: { type: model.family === "bar" ? "shadow" : "line", lineStyle: { color: context.border }, shadowStyle: { color: context.border, opacity: .16 } },
    formatter(params) {
      const entries = Array.isArray(params) ? params : [params];
      if (!entries.length) return "";
      const first = entries[0];
      let label = config.label ?? first.axisValueLabel ?? first.name ?? "";
      if (config.labelFormat) label = dateLabel(label, config.labelFormat);
      const lines = config.hideLabel ? [] : [plainLabel(label)];
      let total = 0;
      for (const item of entries) {
        const index = item.seriesIndex ?? 0;
        const value = Array.isArray(item.value) ? item.value.at(-1) : item.value;
        if (Number.isFinite(Number(value))) total += Number(value);
        const marker = config.indicator === "none" && !config.icons ? "" : `{marker${index}|}  `;
        lines.push(`${marker}${plainLabel(item.seriesName || item.name || rows[index]?.label || "Value")}  ${formatValue(value, config.valueFormat)}`);
      }
      if (config.total) lines.push(`Total  ${formatValue(total, config.valueFormat)}`);
      return lines.join("\n");
    }
  };
}

export function baseOption(model, context) {
  return {
    animation: Boolean(context.motion), animationDuration: 180, animationDurationUpdate: 180,
    backgroundColor: "transparent", color: context.palette,
    textStyle: { fontFamily: context.font, color: context.text, fontSize: 12 },
    aria: { enabled: true, description: model.summary || model.title || "Chart" },
    tooltip: tooltipOption(model, context),
    legend: { show: Boolean(model.config?.legend), bottom: 0, left: "center", itemWidth: 9, itemHeight: 9, icon: "roundRect", itemGap: 16, textStyle: { color: context.muted, fontFamily: context.font, fontSize: 12 }, selectedMode: false }
  };
}

export function cartesianOption(model, context, type = model.family) {
  const config = model.config || {};
  const data = model.data;
  let series = model.series;
  if (config.interactive === "series" && context.selection) series = series.filter((item) => item.key === context.selection);
  const horizontal = Boolean(config.horizontal);
  const normalized = Boolean(config.normalized);
  const labels = data.map((row) => String(row[model.xKey] ?? ""));
  const category = {
    type: "category", data: labels, boundaryGap: type === "bar", axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { color: context.muted, fontFamily: context.font, fontSize: 12, hideOverlap: true, margin: 12,
      formatter: (value) => model.xKey === "date" ? dateLabel(value, "date") : (horizontal ? plainLabel(value) : plainLabel(value).slice(0, 3)) }
  };
  const numeric = {
    type: "value", show: config.axes !== false, ...(normalized ? { max: 100, min: 0 } : {}), axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { show: Boolean(config.axes), color: context.muted, fontFamily: context.font, fontSize: 11, formatter: (value) => `${formatValue(value)}${normalized ? "%" : ""}` },
    splitLine: { show: config.grid !== false, lineStyle: { color: context.border, opacity: .55 } }
  };
  return {
    ...baseOption(model, context),
    grid: { top: config.labels ? 26 : 14, left: 8, right: horizontal && config.labels ? 62 : 14, bottom: config.legend ? 42 : 8, containLabel: true },
    xAxis: horizontal ? numeric : category,
    yAxis: horizontal ? { ...category, inverse: true } : numeric,
    series: series.map((definition, index) => {
      const color = seriesColor(definition, index, context);
      const values = data.map((row, dataIndex) => {
        const raw = row[definition.key];
        let value = typeof raw === "number" && Number.isFinite(raw) ? raw : typeof raw === "string" && raw.trim() && Number.isFinite(Number(raw)) ? Number(raw) : null;
        if (normalized && value !== null) {
          const total = model.series.reduce((sum, entry) => sum + Math.max(0, row[entry.key] || 0), 0);
          value = total ? value / total * 100 : 0;
        }
        const point = { value };
        if (config.mixed || config.dots === "colors") point.itemStyle = { color: context.palette[dataIndex % context.palette.length] };
        if (config.negative) point.itemStyle = { color: context.palette[value < 0 ? 1 : 0] };
        if (config.active) point.itemStyle = { ...(point.itemStyle || {}), opacity: dataIndex === (context.selectedIndex ?? 2) ? 1 : .35 };
        if (config.dots === "custom") point.symbol = `image://${iconImage(row.icon || definition.icon || "success", color)}`;
        return point;
      });
      const curve = config.curve || "smooth";
      const customLabels = config.labels === "custom";
      const item = {
        name: definition.label || definition.key, type: type === "bar" ? "bar" : "line", data: values,
        ...(config.stacked || normalized ? { stack: "moss-total" } : {}),
        smooth: curve === "smooth", ...(curve === "step" ? { step: "middle" } : {}),
        showSymbol: Boolean(config.dots), symbol: "circle", symbolSize: config.dots === "custom" ? 16 : 7,
        connectNulls: false, lineStyle: { color, width: 2 },
        itemStyle: { color, ...(type === "bar" ? { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] } : {}) },
        label: { show: Boolean(config.labels), color: context.text, fontFamily: context.font, fontSize: 11,
          position: horizontal ? "right" : "top", formatter: (params) => customLabels ? `${plainLabel(labels[params.dataIndex])} ${formatValue(params.value)}` : formatValue(params.value) },
        emphasis: { focus: "series", scale: Boolean(config.dots), itemStyle: { opacity: 1 } },
        ...(type === "bar" ? { barMaxWidth: horizontal ? 30 : 42, barCategoryGap: "30%" } : {})
      };
      if (type === "area") item.areaStyle = config.gradient
        ? { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color }, { offset: 1, color: "transparent" }] }, opacity: .45 }
        : { color, opacity: .28 };
      return item;
    })
  };
}
