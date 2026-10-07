import { MONTH_DATA, DAILY_DATA, cartesianOption, iconImage, seriesColor, sourceFor } from "./shared.js";

const desktop = { key: "desktop", label: "Desktop" };
const mobile = { key: "mobile", label: "Mobile" };
const desktopData = MONTH_DATA.map(({ month, desktop }) => ({ month, desktop }));

function example(id, title, summary, { data = desktopData, series = [desktop], xKey = "month", config = {} } = {}) {
  return {
    id, family: "area", title, summary, source: sourceFor(id), xKey,
    description: xKey === "date" ? "Visitors over the last 90 days" : "Visitors from January to June 2024",
    data: data.map((row) => ({ ...row })),
    series: series.map((item) => ({ ...item })),
    config: {
      curve: "smooth", dots: false, axes: false, legend: false,
      ...config,
      tooltip: { indicator: "line", labelFormat: xKey === "date" ? "date" : "month", ...config.tooltip }
    }
  };
}

export const examples = [
  example("chart-area-axes", "Area Chart - Axes", "Combined visits peaked at 505 in February.", {
    data: MONTH_DATA, series: [desktop, mobile],
    config: { stacked: true, axes: true, tooltip: { indicator: "dot" } }
  }),
  example("chart-area-default", "Area Chart", "Desktop visits peaked at 305 in February."),
  example("chart-area-gradient", "Area Chart - Gradient", "Desktop and mobile visits are stacked with fading fills.", {
    data: MONTH_DATA, series: [desktop, mobile],
    config: { stacked: true, gradient: true, tooltip: { indicator: "dot" } }
  }),
  example("chart-area-icons", "Area Chart - Icons", "Desktop and mobile visits have named series markers in the legend and tooltip.", {
    data: MONTH_DATA,
    series: [{ ...desktop, icon: "service" }, { ...mobile, icon: "activity" }],
    config: { stacked: true, legend: true, icons: true, tooltip: { icons: true } }
  }),
  example("chart-area-interactive", "Area Chart - Interactive", "Compare daily desktop and mobile visits over the selected period.", {
    data: DAILY_DATA.slice(-90), xKey: "date", series: [desktop, mobile],
    config: { stacked: true, gradient: true, legend: true, interactive: "range", tooltip: { indicator: "dot" } }
  }),
  example("chart-area-legend", "Area Chart - Legend", "The legend identifies desktop and mobile contributions to total visits.", {
    data: MONTH_DATA, series: [desktop, mobile], config: { stacked: true, legend: true }
  }),
  example("chart-area-linear", "Area Chart - Linear", "Straight segments show the decline from February through April.", {
    config: { curve: "linear", tooltip: { indicator: "dot", hideLabel: true } }
  }),
  example("chart-area-stacked-expand", "Area Chart - Stacked Expanded", "Desktop, mobile, and other visits show their share of each month's total.", {
    data: MONTH_DATA.map((row, index) => ({ ...row, other: [45, 100, 150, 50, 100, 160][index] })),
    series: [desktop, mobile, { key: "other", label: "Other" }],
    config: { stacked: true, normalized: true }
  }),
  example("chart-area-stacked", "Area Chart - Stacked", "Mobile visits exceeded desktop visits in April.", {
    data: MONTH_DATA, series: [desktop, mobile], config: { stacked: true, tooltip: { indicator: "dot" } }
  }),
  example("chart-area-step", "Area Chart - Step", "Monthly desktop totals change in discrete steps.", {
    series: [{ ...desktop, icon: "activity" }],
    config: { curve: "step", icons: true, tooltip: { indicator: "dot", hideLabel: true, icons: true } }
  })
];

export function buildOption(model, context) {
  let recipe = model;
  const days = Number(context.selection);
  if (model.config?.interactive === "range" && [30, 60, 90].includes(days)) {
    recipe = { ...recipe, data: recipe.data.slice(-days) };
  }
  // Upstream draws mobile below desktop, while palette order remains desktop first.
  if (model.config?.stacked) {
    recipe = { ...recipe, series: model.series.map((series, index) => ({ ...series, color: seriesColor(series, index, context) })).reverse() };
  }
  if (model.config?.normalized) {
    recipe = { ...recipe, data: recipe.data.map((row) => ({
      ...row, ...Object.fromEntries(recipe.series.map(({ key }) => [key, Number.isFinite(row[key]) ? row[key] : null]))
    })) };
  }
  const option = cartesianOption(recipe, context, "area");
  option.yAxis.show = true;
  option.series.forEach((series, index) => {
    if (!model.config?.gradient) series.areaStyle.opacity = recipe.series[index].key === "other" ? 0.1 : 0.4;
  });
  if (model.config?.axes === true) option.yAxis.splitNumber = 2;
  if (model.config?.normalized) {
    const formatter = option.tooltip.formatter;
    option.tooltip.formatter = (params) => formatter((Array.isArray(params) ? params : [params]).map((point) => ({
      ...point, value: recipe.data[point.dataIndex]?.[recipe.series[point.seriesIndex]?.key] ?? null
    })));
  }
  if (model.config?.icons && model.config.legend) {
    option.legend.data = recipe.series.map((series, index) => ({
      name: series.label || series.key,
      icon: `image://${iconImage(series.icon, seriesColor(series, index, context))}`
    }));
  }
  return option;
}
