# MossTheme

`MossTheme` is a neutral theme contract. It does not know what a frog, forest, bank, trading desk, or any other inspiration looks like. A designer or AI translates that direction into explicit theme values; Moss applies those values consistently to every component.

```js
import { createMossTheme } from "@brandoriv/moss/theme";

const productTheme = createMossTheme({
  name: "Product theme",
  mode: "system",
  density: "balanced",
  palette: {
    dark: {
      primary: "#36d487",
      primaryStrong: "#82efb5",
      primarySurface: "#123d2a",
      secondary: "#45a6ff",
      secondaryStrong: "#91cbff",
      secondarySurface: "#173954"
    }
  },
  typography: { sans: '"IBM Plex Sans", sans-serif', scale: 1.16 },
  geometry: { sharpness: 0.72 },
  charts: { barRadius: "0", strokeWidth: "2" }
});

productTheme.apply(document.documentElement);
```

Partial values deep-merge over the accessible neutral baseline. Product themes belong in the product repository or a separate themes package, never inside `MossTheme`.

## Adjustable systems

- `palette`: dark/light surfaces, text, borders, primary, secondary, status, and data-series colors.
- `typography`: families, base size, modular scale, weights, tracking, and line heights.
- `densityScale`: control height, table row height, gaps, and insets for each named density.
- `spacing`: base unit, section rhythm, page inset, and content width.
- `geometry`: continuous `sharpness` from `0` (soft) to `1` (sharp), radius bounds, and border width.
- `elevation`: surface, raised, and overlay shadows.
- `motion`: durations, easing, and movement distance.
- `interaction`: focus treatment, hover lift, disabled opacity, and minimum target size.
- `layout`: rail and topbar dimensions (content width belongs to spacing).
- `charts`: stroke, grid, bar, point, and area treatment.
- `components`: shared behavioral defaults that components may consume.

Density and sharpness are independent. A compact interface can still feel soft; a comfortable interface can still use precise geometry.

## Generating a theme from inspiration

When asked to “base this product on a poison dart frog,” an AI should:

1. Interpret the useful qualities: cool habitat surfaces, vivid focal color, small high-contrast signals, compact analytical detail.
2. Produce a normal `MossTheme` value object using semantic roles.
3. Check text and control contrast and keep positive, warning, critical, and information colors distinguishable.
4. Store that object with the product, named for the product, not as a built-in Moss preset.

The inspiration is design input, not an API identifier.

Use `theme.with(overrides)` to derive a variation without mutating the original. `theme.validate()` reports text and non-text contrast failures. `theme.save(key)` and `MossTheme.load(key)` provide opt-in local persistence. The provider follows live operating-system color changes in `system` mode and can persist its effective theme when given `persist-key`.

The provider accepts a theme through its `value` property and optional `mode`/`density` attributes:

```js
const provider = document.querySelector("moss-theme-provider");
provider.value = productTheme;
```

Component defaults are applied as root data attributes and derived variables. Current consumers are rail collapsibility and table density. Spacing units derive the shared spacing ramp; page inset, section gap, and content width control the page and catalog layouts. Geometry controlShape, layout.contentMax, rail.collapsedTooltips, and button.emphasis were removed from the documented contract because they had no consumers. Existing objects may retain those ignored fields during migration.

Mode palettes may include a status object to keep positive, warning, critical, and info text readable on both light and dark surfaces; palette.status remains the shared fallback. validate() checks text, muted and faint text, primary/secondary links, and status text on canvas, surface, raised, and strong backgrounds. Validate custom colored surfaces separately.

DEFAULT_THEME owns the no-script baseline. Run node scripts/tokens.mjs --write after changing it; the parity test prevents drift. Run node scripts/catalog.mjs --write after updating component-status.md.
