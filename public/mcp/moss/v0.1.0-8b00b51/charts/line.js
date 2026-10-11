import { MONTH_DATA, DAILY_DATA, BROWSER_DATA, cartesianOption, seriesColor, sourceFor } from "./shared.js";

const desktop = { key: "desktop", label: "Desktop" };
const mobile = { key: "mobile", label: "Mobile" };
const visitors = { key: "visitors", label: "Visitors" };
const desktopData = MONTH_DATA.map(({ month, desktop }) => ({ month, desktop }));

function example(id, title, summary, { data = desktopData, series = [desktop], xKey = "month", config = {} } = {}) {
  return {
    id, family: "line", title, summary, source: sourceFor(id), xKey,
    description: xKey === "date" ? "Page views over the last 90 days" : "January - June 2024",
    data: data.map((row) => ({ ...row })),
    series: series.map((item) => ({ ...item })),
    config: {
      curve: "smooth", dots: false, labels: false, axes: false, legend: false,
      ...config,
      tooltip: { indicator: "dot", hideLabel: true, labelFormat: xKey === "date" ? "date" : "month", ...config.tooltip }
    }
  };
}

export const examples = [
  example("chart-line-default", "Line Chart", "Desktop visits peaked at 305 in February."),
  example("chart-line-dots-colors", "Line Chart - Dots Colors", "Colored markers distinguish Chrome, Safari, Firefox, Edge, and other browsers.", {
    data: BROWSER_DATA.map((row, colorIndex) => ({ ...row, colorIndex })), xKey: "browser", series: [visitors],
    config: { axes: "none", dots: "colors", tooltip: { indicator: "line" } }
  }),
  example("chart-line-dots-custom", "Line Chart - Custom Dots", "Semantic activity markers identify each month's desktop observation.", {
    data: MONTH_DATA.map((row) => ({ ...row, icon: "activity" })),
    series: [{ ...desktop, icon: "activity" }], config: { dots: "custom" }
  }),
  example("chart-line-dots", "Line Chart - Dots", "A filled marker identifies every monthly desktop total.", {
    data: MONTH_DATA, config: { dots: true }
  }),
  example("chart-line-interactive", "Line Chart - Interactive", "Choose desktop or mobile to compare daily page views.", {
    data: DAILY_DATA.slice(-90), xKey: "date", series: [desktop, mobile],
    config: { interactive: "series", tooltip: { hideLabel: false } }
  }),
  example("chart-line-label-custom", "Line Chart - Custom Label", "Browser names label their visitor totals directly on the line.", {
    data: BROWSER_DATA, xKey: "browser", series: [visitors],
    config: { axes: "none", dots: true, labels: "custom", tooltip: { indicator: "line" } }
  }),
  example("chart-line-label", "Line Chart - Label", "Exact desktop totals appear above the monthly markers.", {
    data: MONTH_DATA, config: { dots: true, labels: "value", tooltip: { indicator: "line", hideLabel: false } }
  }),
  example("chart-line-linear", "Line Chart - Linear", "Straight segments connect the monthly desktop totals.", {
    config: { curve: "linear" }
  }),
  example("chart-line-multiple", "Line Chart - Multiple", "Mobile visits exceeded desktop visits only in April.", {
    data: MONTH_DATA, series: [desktop, mobile], config: { tooltip: { hideLabel: false } }
  }),
  example("chart-line-step", "Line Chart - Step", "Desktop totals remain level within each monthly step.", {
    config: { curve: "step" }
  })
];

export function buildOption(model, context) {
  let recipe = model;
  if (model.config?.interactive === "series") {
    const selected = model.series.find((series) => series.key === context.selection) || model.series[0];
    recipe = { ...model, series: [{ ...selected, color: seriesColor(selected, model.series.indexOf(selected), context) }] };
    context = { ...context, selection: selected.key };
  }
  if (model.xKey === "browser") {
    recipe = { ...recipe, series: recipe.series.map((series, index) => ({ ...series, color: seriesColor(series, index + 1, context) })) };
  }
  const option = cartesianOption(recipe, context, "line");
  option.yAxis.show = true;
  if (model.config?.axes === "none") {
    option.xAxis.show = false;
    option.yAxis.axisLabel.show = false;
  }
  if (model.config?.dots === "colors") {
    option.series[0].data.forEach((point, index) => {
      const colorIndex = recipe.data[index].colorIndex;
      point.itemStyle.color = seriesColor(null, Number.isInteger(colorIndex) && colorIndex >= 0 ? colorIndex : index, context);
    });
  }
  if (model.config?.labels === "custom") {
    option.series[0].label.formatter = (point) => {
      const label = String(recipe.data[point.dataIndex]?.[model.xKey] ?? "").replace(/[{}]/g, "");
      return label.charAt(0).toUpperCase() + label.slice(1);
    };
  }
  return option;
}
