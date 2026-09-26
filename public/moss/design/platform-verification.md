# Platform verification

Verified on 2026-09-26 in isolated checkouts for PR #32. The follow-up assessment
used an exclusively leased Workspace Manager clone; baseline checkouts were untouched.
Local toolchain: Windows, Node 24.15.0, .NET SDK 10.0.301, Playwright Chromium.
This records observed coverage, not a promise that every device behaves identically.

## Architecture and compatibility

The neutral catalog and C# hosts share the shadcn MossTheme preset, scoped CSS,
local Geist font, semantic icons, chart recipes, and Apache ECharts 6.1.0 SVG
renderer. The Razor library maps its assets directly to the canonical `src`
files during development and packages those same files for web and Hybrid.
There is no separately authored component stylesheet for a platform.

Existing npm entry points, DEFAULT_THEME, and generated baseline tokens retain
their behavior. The new neutral appearance is the default in the catalog and
C# provider; existing web products opt in through the preset and scoped adapter.
Product palette, geometry, density, and mode overrides remain MossTheme data.
This is a shadcn-inspired Moss renderer, not an embedded React/shadcn runtime.

## Evidence

| Target or contract | Observed result | Remaining limits |
| --- | --- | --- |
| Chart inventory | Exactly 70 examples match commit `d82b4a7d98430da156d6a8ad6973c87279a0c5e3`; every ID carries its upstream link | Pinned coverage, not automatic synchronization with future upstream additions |
| JavaScript contract suite | `npm test`: 67 passed, one browser-only check intentionally skipped | The skipped check runs in the browser command |
| Browser runtime checks | 16 checks passed for recipes, touch targets, lazy loading, cleanup, safe tooltips, states, theme inheritance, and Blazor bridge | Chromium, not every browser engine |
| Neutral-theme browser checks | 12 passed, including light/dark at 1440px and 390px and AA theme validation | Automated checks do not replace usability research |
| Complete Playwright suite | 48 passed with the live published Blazor host enabled; chart geometry covers all 70 IDs at desktop and phone sizes | Native WebViews were not launched |
| Component documentation tabs | Every component defaults to Example with separate Implementation, States, and Responsibilities; nested isolation, keyboard/focus, source retry/copy, and light/dark accessibility passed; screenshots inspected at 1440px, 390px, and 320px | Narrow tab strips scroll horizontally |
| Development Blazor host | Two end-to-end tests passed at desktop and phone sizes using `dotnet run`; CSS, charts, engine, and local font served nonempty bodies | Interactive server needs its host connection |
| C# library and web host | Release build and publish passed with zero warnings/errors; JSON, overlapping renders, disposal, density, and all 36 development asset mappings checked | NuGet publication is not part of this task |
| MAUI Windows | Final build passed with zero warnings/errors; all 36 current renderer assets packaged under unchanged URLs with identical source bytes | Unpackaged app; native launch and WebView screenshots not verified |
| MAUI Android | Final build passed with zero warnings/errors; signed APK contains all 36 current source-identical assets and no unused OpenSans or test-harness files | No emulator or physical-device launch verified |
| iOS and Mac Catalyst | Platform targets and entry points are present | Not built or run on Windows; Mac and Apple tooling/signing required |
| Linux | Ubuntu CI passed the Release web/library build, asset mappings, C# contract checks, and both live Blazor workflows | Screenshot references are OS-specific; no native MAUI Linux renderer |

The C# workflow checks exercise mode and authored-theme switching, density,
loading/empty/partial/error/disabled states, retry, keyboard selection and typed
callbacks, field validation, native dialog Escape/focus restoration, review and
application of readings, interactive slice selection, accessibility, overflow,
and action rows that do not cover form fields.

Eight committed chart screenshot baselines cover light/dark at desktop/phone
sizes on Windows and Linux. Linux references were captured in Ubuntu CI and
reviewed before committing. OS-specific baselines account for text rendering
differences without relaxing the 1% pixel tolerance or changing the renderer.
The neutral font is bundled and its actual loading is checked. The
catalog has applicability guidance, family/search filters, source links,
four documentation tabs per component, and preserved product-theme preferences.

`npm audit --omit=dev` reported zero vulnerabilities. `npm pack --dry-run`
included the local engine, fonts, source contracts, and third-party notices.
The design detector flagged only inherited loading-skeleton animation and
stripe rules, not new decorative treatment in the chart surface.

## Follow-Up Assessment

Ponytail identified 50 removable lines: duplicate area-legend icon encoding,
inherited pie-tooltip defaults, and unused MAUI template assets and commentary.
Those cuts preserve the chart inventory, platform targets, and required lifecycle behavior.
The JavaScript, runtime, theme, C#, and complete 48-test browser checks passed again.
Bridge assertions now wait for the actual disabled state and queued dialog-close
callback; ten fresh browser runs passed without test retries or fixed delays.
Windows and Android builds passed without warnings or errors; all 36 packaged
renderer assets match canonical source bytes, with no unused template or harness assets.

## Reproduce

```powershell
npm ci
npx playwright install chromium
npm test
npm run test:dotnet
npm run test:browser
```

For the live C# checks, run the web sample in another terminal using its
Development launch profile, then include it in the complete browser suite:

```powershell
dotnet run --project dotnet/samples/Moss.Web/Moss.Web.csproj --launch-profile http --urls http://127.0.0.1:8780
```

```powershell
$env:MOSS_BLAZOR_TEST_URL = 'http://127.0.0.1:8780/'
npm run test:browser
```

Without that environment variable, the two live-host tests are explicitly
skipped; the independent bridge check still runs. CI starts a development host
and runs those tests. Run browser suites sequentially because Playwright owns
its output directory. Native target build commands are in `dotnet/samples/README.md`.

No production deployment or native device launch was performed. This work is
isolated from the user's original checkout and awaits review before merge.
