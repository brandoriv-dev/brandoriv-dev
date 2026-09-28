# Moss charts

The chart catalog at `docs/charts.html` is a working reference for developers
choosing evidence for a product question. Choose a family first, then inspect
the summary and marks; exact source values and runnable example code are one
disclosure away. Each family has Use when, Avoid when, and Mobile guidance.
Search matches title, summary, description, and exact recipe ID. Family and
search filters are shareable URL parameters; recipe headings are permalinks.
No-result recovery clears both filters and returns focus to search.

## Theme authority

MossTheme is the sole authority for theme values. `shadcnTheme` and
`createShadcnTheme` in `src/presets/shadcn.js` are compatibility presets, not a
separate theme engine. Load the Tailwind-built `src/moss.css` and
`src/charts.css` for chart runtime anatomy. The stylesheet imports locally
bundled Geist Variable from `src/vendor/geist/index.css`; it needs no remote
font request. The engine is bundled locally too.

Both catalogs default to neutral, and share `moss-catalog-preferences` with the
existing `character` and `mode` keys. All five authored frog themes remain
selectable and keep their values, with system font fallbacks. A valid saved
product theme and light/dark choice win over the default. Unavailable storage,
malformed JSON, or an unknown theme do not prevent use. The neutral selection
uses MossTheme values without requiring a compatibility style attribute. The
root core `DEFAULT_THEME` remains the legacy value for existing consumers.

## Model and API

The public contract in `agent-authoring.md` and this chart contract is binding. Recipes are
serializable records with `id`, `family`, `title`, `description`, `summary`,
`xKey`, `data`, `series`, and `config`. `getChartExample(id)` returns an
independent model; an unknown ID returns null. The catalog uses the exact 70
IDs pinned in `shadcn-chart-inventory.json`, including all tooltip variants.
Every item links to its upstream source at the pinned commit.

```js
import { getChartExample } from "@brandoriv/moss/chart-recipes";
import "@brandoriv/moss/charts";

const chart = document.querySelector("moss-chart");
chart.config = getChartExample("chart-area-interactive");
chart.data = productRows;
chart.summary = "A product-authored conclusion consistent with these rows.";
```

`<moss-chart preset="chart-area-default"></moss-chart>` is the declarative
alternative. Chart CSS is an explicit host import. The SVG engine loads lazily
from `src/vendor/echarts.esm.min.js`; importing the optional element does not
immediately load ECharts. An IntersectionObserver with a 240px root margin
defers SVG work until a chart is near the viewport. Summaries, controls, and
exact tables are prepared immediately, including offscreen charts. Theme
changes update visible plots; deferred plots use the current theme when they
enter the observation area. A usable model state alone does not prove SVG
geometry has been rendered. The runtime viewport class is
`.moss-chart-runtime__viewport`. `dataset.chartState` is `loading`, `ready`,
`partial`, `empty`, or `error`; disabled is an independent attribute.

`moss-chart-ready` fires only after an actual render, not merely after model
preparation or custom-element connection. `moss-chart-select` supplies
`{ index, key, value }`; the host decides what selecting evidence means.
Range choices are 30, 60, and 90 days; series choices use series keys; slice
choices use data indices. These are real native selectors, not simulated
toolbar labels. The source code disclosure uses text nodes, and the copy
action uses the semantic `copy` moss-icon. Clipboard denial reports a local
message and focuses the code for manual selection.

## Lifecycle and data

| State | Behavior and host responsibility |
|---|---|
| Loading | `loading` reserves the chart region, exposes busy/status feedback, and prevents point interaction; the host owns fetch start, cancellation, timeout, and completion. |
| Ready | Valid finite values provide a summary and exact-data disclosure; SVG renders near the viewport and zero remains a valid value. |
| Empty | Empty rows or no usable numeric values show an explicit no-data state; the host supplies the next action or changes the query. |
| Partial | Missing or nonfinite series values are treated as missing evidence; available values render and the status identifies incomplete data without inventing zeroes. |
| Error | Invalid configuration, unknown presets, renderer failure, or an explicit `error` shows a named problem; renderer retries do not replace host data-fetch recovery. |
| Disabled | `disabled` removes point interaction and disables selectors; evidence and exact data remain readable. |
| Refresh | Replacing `.data` or `.config` updates evidence and visible geometry; offscreen geometry waits until near the viewport, and the host prevents stale fetch results from overwriting newer ones. |
| Disconnect | The element releases the ECharts instance, observers, listeners, and scheduled work; reconnect renders a fresh instance. |

Preserve original values in exact data, including missing/null evidence.
Host rows are data, never markup. Tooltip text uses ECharts rich-text mode;
hosts cannot pass executable formatter strings. Products own locale,
currency/percent conventions, units, timestamps, timezone policy, and narrative
accuracy. Do not infer a meaningful pie denominator or radial bound from an
unrelated product dataset. Keep explicit series colors for semantic product
overrides; normal data colors come from MossTheme.

## Keyboard, focus, and layout

Tab reaches native chart controls, the chart viewport, Chart data, data rows,
and code/source actions. Arrow keys, Home, and End inspect plotted points;
selection feedback is available without hover. Native select menus keep their
platform key behavior. Enter and Space operate disclosures, and disabled
controls retain native disabled semantics. Focus rings use theme values.

On phones, chart families use one column, family applicability becomes a native
disclosure before the examples, search gets its own row, and product theme
remains directly reachable. The runtime reduces axis detail, expands
selection controls to usable touch targets, and keeps exact data in a bounded
scroll region. Labels and summaries wrap, while long code and wide data scroll
inside their own evidence regions. Large screens use two columns and, at
sufficient width, three; sections remain unframed and only individual charts
have a tool boundary. Theme, density, viewport, and reduced-motion changes
refresh the chart; reduced motion suppresses decorative movement. Never encode
essential meaning only in color or tooltip hover.

## Sources and coverage

The inventory pins shadcn-ui/ui commit
`d82b4a7d98430da156d6a8ad6973c87279a0c5e3`, checked on 2026-09-26.
Source links identify individual upstream examples; these Moss recipes use
Apache ECharts rather than Recharts. Engine and font attribution are recorded
in `THIRD-PARTY-NOTICES.md`. Different engines can produce small geometry and
label-layout differences; matching IDs does not establish pixel identity.

| Host | Intended support | Verification |
|---|---|---|
| Plain web | Shared CSS, recipes, custom elements, and local engine in modern browsers | Catalog checks are recorded below; full parent-owned browser checks and snapshots are separate. |
| Blazor web | Razor wrappers use the same web renderer and theme values | C# build and interop checks belong to the host work; this catalog change does not prove them. |
| MAUI Blazor Hybrid | Same Razor views and renderer in supported platform WebViews | Requires target builds and actual host/device checks; a Chromium phone viewport is not a MAUI device check. |
| Linux | Web host | Linux-native MAUI packaging and native XAML visual parity are not promised. |

Catalog checks on 2026-09-26 passed exact inventory parity, seven-family
coverage, ASCII output, generated status synchronization, the existing Moss
catalog validator, and JavaScript syntax checks. Chromium at 1440x1000 and
390x844 rendered all 70 presets with nonblank SVG geometry after scrolling each
example into view, including after near-viewport deferral was added. Search, family
filtering, no-result recovery and focus, safe code disclosure, clipboard copy,
neutral/frog switching, mode persistence across both catalogs, saved URL
filters, permalink recovery from conflicting filters, and page overflow checks
passed. Loading, empty, partial, error, zero-valued ready, disabled, 30-day
range selection, and keyboard End selection passed at both sizes. Axe found no
violations in the filtered bar example in light and dark at either size. The
parent owns full browser tests and
reference snapshots; these targeted checks do not replace that suite.

The served CSP during these checks had `font-src https://fonts.gstatic.com`
and blocked local Geist. Geometry and interactions were verified with the
fallback font; deterministic Geist captures require the hosting owner to allow
`font-src 'self'`. This is an observed hosting limitation, not a reason to add
remote fonts. Browser screenshots establish layout only for the browsers and
viewport sizes actually exercised; native host coverage must never be inferred
from them.
