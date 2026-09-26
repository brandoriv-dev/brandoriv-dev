# Shared renderer implementation contract

This work implements Brandon's request for shadcn-like Moss across web, Blazor,
and .NET MAUI Blazor Hybrid. The primary job is building cohesive functional
applications in C# without recreating styles in every product. shadcn's neutral
visual language is the reference. Preserve existing Moss behavioral contracts.

## Architecture

- Core: structured theme values, semantic tokens, icon names, chart data and
  recipe contracts, applicability and accessibility rules.
- Web: the existing CSS and custom elements, an optional shadcn theme and CSS
  adapter, and a lazily loaded Apache ECharts renderer.
- Blazor: a Razor class library wrapping the same web components and styles,
  typed C# chart records, events, and lifecycle-safe JavaScript interop.
- Hosts: a Blazor web app and a MAUI Blazor Hybrid app use the same Razor views
  and renderer. Native XAML visual parity and Linux-native packaging are not
  promised; MAUI supports its platform targets and Linux uses the web host.
- Recipes: exact upstream chart IDs and source references. Future React hosts
  can consume the custom elements and CSS without a second rendering engine.

Keep the root npm package and current imports compatible. Avoid a speculative
workspace monorepo; add explicit subpath exports and a `dotnet` renderer folder.

## Chart module contract

Each family module in `src/charts/` exports `examples` and `buildOption(model,
context)`. Cartesian families share `cartesianOption` from `shared.js`.

An example is a serializable object:

```js
{
  id: "chart-area-default", family: "area", title: "Area Chart",
  description: "Visits from January to June", summary: "Desktop visits peaked in March.",
  xKey: "month", data: [{ month: "January", desktop: 186 }],
  series: [{ key: "desktop", label: "Desktop", icon: "service" }],
  config: { curve: "smooth", legend: false }
}
```

`buildOption` returns Apache ECharts options. It receives `{ palette, text,
muted, border, surface, font, width, motion, selectedIndex, selection }`.
All colors come from these values. The default chart palette reads Moss data
tokens. A series may have an explicit color only as a semantic product override.
Avoid tooltip HTML interpolation. Tooltips use ECharts `renderMode: "richText"`
with plain-text formatters. Never execute formatter strings supplied by hosts.

`shared.js` exports `MONTH_DATA`, `DAILY_DATA`, `BROWSER_DATA`, `cartesianOption`,
`baseOption`, `seriesColor`, `formatValue`, and `sourceFor`.

Canonical cartesian config: `curve` = smooth/linear/step; `stacked`, `normalized`,
`gradient`, `axes`, `legend`, `horizontal`, `labels` = false/value/custom;
`dots` = false/true/custom/colors; `mixed`, `negative`, `active`; `icons`.
Tooltip config: `tooltip: { indicator: dot/line/none, hideLabel, label,
labelFormat: month/date, valueFormat: number/currency/percent, total, icons }`.
Use rich-text styles for indicators and registered icon SVG data URLs when
needed; do not substitute Unicode glyphs for semantic icons.

Pie/radar/radial family-specific config belongs in each module. Ensure every
variant changes actual chart behavior and anatomy, not only its title.

Interactive examples use `config.interactive: "range" | "series" | "slice"`.
The renderer presents native keyboard-accessible controls and passes the
current selection to builders. Range values are 30, 60, and 90 days; series
selection uses series keys; slice selection uses data indices. Time examples
use DAILY_DATA. `selectedIndex` drives active sector/bar emphasis.

## Public web API

```js
import { chartExamples, getChartExample, buildChartOption } from "@brandoriv/moss/chart-recipes";
import "@brandoriv/moss/charts";
document.querySelector("moss-chart").config = getChartExample("chart-area-default");
```

`<moss-chart preset="chart-area-default" summary="..."></moss-chart>` also works.
`.config` accepts an example/model object; `.data` replaces its rows. Attributes
`loading`, `disabled`, `error`, and `summary` represent explicit states. Dispatch
`moss-chart-select` with `{ index, key, value }` and `moss-chart-ready` when rendered.
Use an SVG renderer for consistent screenshots and accessible geometry. Include
an accessible summary and a keyboard-reachable exact data table. Clean up
ResizeObserver, theme observers, events, and ECharts instances on disconnect.
Re-render on inherited theme changes, window size, density, and reduced motion.
Import the bundled engine locally from `src/vendor/echarts.esm.min.js`; no CDN or
runtime network dependency. Charts are an optional export to avoid loading the
engine in products that do not use it.

## Visual contract

Use the same `src/presets/shadcn.js` (`shadcnTheme`, `createShadcnTheme`) and
`src/shadcn.css` in all hosts. The CSS imports Moss styles and adds scoped
`[data-moss-style="shadcn"]` styling and shadcn semantic aliases. The neutral
theme uses light/dark surfaces, locally bundled Geist typography, clear border
and focus treatment, modest radius,
restrained type, and five distinct chart colors. Existing product themes remain
selectable. No host maintains a separate copy of component CSS.

## Completion evidence

Pin the 70 upstream IDs in `design/shadcn-chart-inventory.json`, checked on
2026-09-26. Test exact inventory parity, distinct option behavior, invalid and
partial data, accessible states, all seven chart families, theme switching,
keyboard/touch interaction, and desktop/phone screenshots. Build the Razor
library and sample web app; build available MAUI targets and report any host
tooling limitation. Record tested platform coverage separately from intended
platform support. Document source attribution and dependency licensing.
