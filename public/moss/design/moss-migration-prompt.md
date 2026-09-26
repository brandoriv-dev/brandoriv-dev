# Moss expansion prompt

Use this prompt for future implementation agents. The initial migration's
architecture contract is in platform-implementation.md.

> Evolve Moss into a cohesive shadcn-like design system for C# developers using
> Blazor web apps and .NET MAUI Blazor Hybrid on mobile and desktop. Keep
> MossTheme as the source of theme values. Make a neutral theme the default
> experience while preserving authored product themes and all existing public
> component behavior. Treat shadcn's component styling and chart anatomy as the
> visual reference, and use checked-in shared styles instead of asking agents
> to imitate screenshots independently.
>
> Separate portable theme values, icon names, and data contracts from web
> element registration. Keep the web renderer as the shared implementation and
> expose typed C# components through a Razor class library. Package the exact
> same JavaScript and CSS into web and Hybrid hosts. Use local bundled assets
> so runtime rendering works offline. Do not promise native XAML rendering or
> device verification that has not been performed.
>
> Implement every chart example identified in the pinned shadcn inventory:
> area, bar, line, pie/donut, radar, radial, and tooltip variants. Match actual
> features, including stacking, percent normalization, curve interpolation,
> grids, custom labels, semantic icons, center text, active shapes, time-range
> selection, and tooltip content. Every registry ID must map to a real example
> and carry an upstream source link. Use a proven chart engine. Make the
> engine an optional lazy import and retain accessible exact data independently
> of the picture.
>
> Define loading, empty, partial, invalid/error, disabled, long-content,
> keyboard/focus, overflow, touch, phone, and large-screen behavior. Keep chart
> and control dimensions stable. Respect inherited themes and reduced motion.
> Clean up rendering instances, observers, JavaScript callbacks, and .NET
> references when components disconnect.
>
> Partition agent work by disjoint file ownership under one branch and PR.
> Preserve unrelated work. Read AGENTS.md and design rules first. Update the
> component status catalog and applicability blocks. Verify exact registry
> parity, distinct option behavior, real interactions, accessibility, and
> desktop/mobile screenshots. Build the C# library and hosts. Report verified
> targets and remaining tooling or device gaps with direct evidence.

## Acceptance criteria

- Inventory parity is exact against the 70 pinned upstream chart IDs.
- New catalog and C# hosts default to the neutral MossTheme preset.
- Products can override MossTheme without editing component styles.
- Web and Hybrid hosts consume one component renderer and asset set.
- C# chart data, state, and event APIs work through lifecycle-safe interop.
- Examples render without network-fetched libraries or fonts.
- Tests, builds, screenshot baselines, and known platform limits are recorded.
