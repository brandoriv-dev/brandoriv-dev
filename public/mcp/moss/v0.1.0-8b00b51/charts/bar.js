import { MONTH_DATA, DAILY_DATA, BROWSER_DATA, cartesianOption, seriesColor, formatValue, sourceFor } from "./shared.js";

const desktop = { key: "desktop", label: "Desktop" };
const mobile = { key: "mobile", label: "Mobile" };
const visitors = { key: "visitors", label: "Visitors" };
const desktopData = MONTH_DATA.map(({ month, desktop }) => ({ month, desktop }));

function example(id, title, summary, { data = desktopData, series = [desktop], xKey = "month", config = {} } = {}) {
  return {
    id, family: "bar", title, summary, source: sourceFor(id), xKey,
    description: xKey === "date" ? "Page views over the last 90 days" : "January - June 2024",
    data: data.map((row) => ({ ...row })),
    series: series.map((item) => ({ ...item })),
    config: {
      axes: false, legend: false, labels: false,
      ...config,
      tooltip: { indicator: "dot", hideLabel: true, labelFormat: xKey === "date" ? "date" : "month", ...config.tooltip }
    }
  };
}

export const examples = [
  example("chart-bar-active", "Bar Chart - Active", "Firefox leads with 275 visitors and is highlighted initially.", {
    data: BROWSER_DATA.map((row, colorIndex) => ({ ...row, colorIndex, visitors: { chrome: 187, safari: 200, firefox: 275, edge: 173, other: 90 }[row.browser.toLowerCase()] })),
    xKey: "browser", series: [visitors], config: { mixed: true, active: true }
  }),
  example("chart-bar-default", "Bar Chart", "Desktop visits peaked at 305 in February."),
  example("chart-bar-horizontal", "Bar Chart - Horizontal", "February has the longest desktop-visit bar.", {
    config: { horizontal: true }
  }),
  example("chart-bar-interactive", "Bar Chart - Interactive", "Choose desktop or mobile to compare daily page views.", {
    data: DAILY_DATA.slice(-90), xKey: "date", series: [desktop, mobile],
    config: { interactive: "series", tooltip: { hideLabel: false } }
  }),
  example("chart-bar-label-custom", "Bar Chart - Custom Label", "Month names sit inside each bar, with exact desktop totals at its end.", {
    data: MONTH_DATA,
    config: { horizontal: true, axes: "none", labels: "custom", tooltip: { indicator: "line", hideLabel: false } }
  }),
  example("chart-bar-label", "Bar Chart - Label", "Exact desktop totals appear above each monthly bar.", {
    config: { labels: "value" }
  }),
  example("chart-bar-mixed", "Bar Chart - Mixed", "Chrome leads browser visits with 275; other browsers account for 90.", {
    data: BROWSER_DATA.map((row, colorIndex) => ({ ...row, colorIndex })),
    xKey: "browser", series: [visitors], config: { horizontal: true, mixed: true }
  }),
  example("chart-bar-multiple", "Bar Chart - Multiple", "Grouped bars compare desktop and mobile visits for each month.", {
    data: MONTH_DATA, series: [desktop, mobile], config: { tooltip: { indicator: "line", hideLabel: false } }
  }),
  example("chart-bar-negative", "Bar Chart - Negative", "March and May have negative visitor changes of 207 and 209.", {
    data: [
      { month: "January", visitors: 186 },
      { month: "February", visitors: 205 },
      { month: "March", visitors: -207 },
      { month: "April", visitors: 173 },
      { month: "May", visitors: -209 },
      { month: "June", visitors: 214 }
    ],
    series: [visitors], config: { negative: true, axes: "none", labels: "custom", tooltip: { indicator: "none" } }
  }),
  example("chart-bar-stacked", "Bar Chart - Stacked", "Combined desktop and mobile visits peaked at 505 in February.", {
    data: MONTH_DATA, series: [desktop, mobile], config: { stacked: true, legend: true }
  })
];

export function buildOption(model, context) {
  let recipe = model;
  if (model.config?.interactive === "series") {
    const selected = model.series.find((series) => series.key === context.selection) || model.series[0];
    recipe = { ...model, series: [{ ...selected, color: seriesColor(selected, model.series.indexOf(selected), context) }] };
    context = { ...context, selection: selected.key };
  }
  const activeContext = model.config?.active && context.selectedIndex == null ? { ...context, selectedIndex: 2 } : context;
  const option = cartesianOption(recipe, activeContext, "bar");
  const numeric = model.config?.horizontal ? option.xAxis : option.yAxis;
  numeric.show = !model.config?.horizontal || model.config.labels === "custom" || model.config.axes === true;
  if (model.config?.axes === "none") {
    (model.config.horizontal ? option.yAxis : option.xAxis).show = false;
    numeric.axisLabel.show = false;
  }
  const category = model.config?.horizontal ? option.yAxis : option.xAxis;
  if (model.xKey === "browser") {
    category.axisLabel.formatter = (value) => {
      const label = String(value ?? "").replace(/[{}]/g, "");
      return label.charAt(0).toUpperCase() + label.slice(1);
    };
  } else if (model.xKey === "month") {
    category.axisLabel.formatter = (value) => String(value ?? "").slice(0, 3);
  }
  if (model.config?.mixed) {
    option.series[0].data.forEach((point, index) => {
      const colorIndex = recipe.data[index].colorIndex;
      point.itemStyle.color = seriesColor(null, Number.isInteger(colorIndex) && colorIndex >= 0 ? colorIndex : index, context);
    });
  }
  if (model.config?.active) {
    option.series[0].data.forEach((point, index) => {
      const active = index === activeContext.selectedIndex;
      point.itemStyle = {
        ...point.itemStyle, opacity: active ? 0.8 : 1, borderWidth: active ? 2 : 0,
        borderColor: point.itemStyle?.color, borderType: active ? "dashed" : "solid"
      };
    });
  }
  if (model.config?.labels === "custom") {
    const series = option.series[0];
    if (model.config.horizontal) {
      series.label.formatter = (point) => formatValue(point.value);
      series.markPoint = {
        silent: true, symbolSize: 0, tooltip: { show: false },
        label: { show: true, position: "right", distance: 8, color: context.surface, fontFamily: context.font, fontSize: 11,
          formatter: (point) => String(point.name ?? "").replace(/[{}]/g, "") },
        data: recipe.data.map((row) => ({ name: String(row[model.xKey] ?? ""), coord: [0, row[model.xKey]] }))
      };
    } else {
      series.label.formatter = (point) => String(recipe.data[point.dataIndex]?.[model.xKey] ?? "").replace(/[{}]/g, "");
    }
  }
  if (model.config?.horizontal && model.config.labels !== "custom") option.xAxis.splitLine.show = false;
  return option;
}
