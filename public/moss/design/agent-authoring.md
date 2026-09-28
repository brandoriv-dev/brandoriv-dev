# Agent authoring contract

Moss is maintained for coding agents first. Consumers should see semantic Moss
components and MossTheme values; Tailwind is an internal authoring tool.

## Source of truth

| Need | Edit | Do not edit |
|---|---|---|
| Global CSS layers and imports | `tools/moss-css/moss.input.css` | `src/moss.css` |
| Base component primitives | `tools/moss-css/components/foundation.css` | generated selectors in `src/moss.css` |
| Buttons, fields, selects, switches | `tools/moss-css/components/controls.css` | product CSS overrides |
| Charts, readings, tables | `tools/moss-css/components/data.css` | chart host styles |
| Rails, tabs, chips, menus | `tools/moss-css/components/navigation.css` | one-off product navigation CSS |
| App shell, page, panel, layout | `tools/moss-css/components/shell.css` | copied shell styles in hosts |
| Analytical display helpers | `tools/moss-css/components/analytics.css` | product-only metric cards |
| Dialogs, tooltips, code, details | `tools/moss-css/components/overlays.css` | duplicated overlay styles |
| Workflow components | `tools/moss-css/components/workflows.css` | app-specific flow CSS |
| Responsive transformations | `tools/moss-css/components/responsive.css` | hard-coded viewport copies |
| Compatibility preset styling | `tools/moss-css/compat/shadcn.css` | `src/shadcn.css` |

`src/moss.css` is generated from `tools/moss-css/**`. Build it with
`npm run build:css`; verify it without changing files with `npm run check:css`.

## Add or tune a component

1. Start with `design/component-status.md` and confirm the component exists,
   needs a new shared behavior, or belongs in the product.
2. Edit the smallest owning file in `tools/moss-css/components/`.
3. Keep consumer markup semantic: `.moss-*` classes, Moss custom elements, and
   `<moss-icon name="...">`.
4. Tune product appearance through MossTheme values before adding component CSS.
5. Update `docs/index.html` examples and applicability blocks when shared
   behavior changes.
6. Update `design/component-status.md` with states, gaps, and ownership notes.
7. Run `npm run build:css`, `npm test`, and browser tests proportional to the
   component's risk.

## CSS style rules

Use `@apply` for obvious layout, display, spacing, sizing, and color utilities.
Use ordinary CSS for Moss tokens, pseudo-elements, container queries, complex
selectors, browser APIs, animations, and stateful component contracts.

Do not add Tailwind utility classes to consumer markup. Tailwind is the way Moss
authors package CSS, not the public API for Moss consumers.

## Consumer tuning

| Product need | Use | Avoid |
|---|---|---|
| Brand color | `MossTheme.palette.light.primary` and dark equivalent | Recoloring `.moss-button` directly |
| Compact desktop app | `density: "compact"` | Shrinking individual controls |
| Mobile touch targets | Moss responsive components and density tokens | Product-only media-query forks |
| Sharper enterprise UI | `geometry.sharpness` and radius values | Overriding every border radius |
| Chart palette | `palette.data` | Editing chart renderer internals |
| Reduced motion | `motion` values or `data-moss-motion="reduce"` | Removing animations component by component |
