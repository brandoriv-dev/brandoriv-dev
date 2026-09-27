# Component status

Status progresses through `Proposed -> Specified -> Built -> Tested -> Documented -> Adopted`.

| Component | Status | Implemented states | Known gaps |
|---|---|---|---|
| MossTheme and tokens | Tested | value objects, text-role/surface contrast reports, generated CSS baseline parity, persistence, live system/light/dark, three densities, primary/secondary color, type, spacing, sharpness, elevation, motion, interaction, layout, charts, applied component defaults | Broader APCA reporting may follow WCAG support |
| Button | Documented | primary, secondary, quiet, icon, disabled, busy | Destructive-action recipe pending |
| Field | Documented | help, error, disabled | Rich input pending |
| Persistent rail | Tested | expanded, collapsed, default-collapsed first load, explicit persisted preference, hover/focus labels, responsive bottom navigation without destination loss, parent-bounded stretch sizing | Product-level destination selection remains host-owned |
| Signal | Documented | info, positive, warning, critical | Queued/partial variant pending |
| Narrative data module | Documented | line and comparison charts, direction tones, optional one-shot data draw, compact/flush sizing, zero/tick and empty hooks, axes, legends, annotations, accessible summary, evidence action, container-aware composition | MossChart is the optional model renderer; product interpretation and annotations remain host-owned |
| shadcn neutral preset | Tested | normal MossTheme values, local Geist Variable, light/dark surfaces, shared CSS adapter, five data colors, catalog default, saved product-theme and mode preferences, all five frog fixtures retained | Catalog preference checks pass in Chromium desktop/phone; local font loading needs hosting CSP font-src self; native host and device verification is tracked separately |
| MossChart engine and recipes | Tested | 70 pinned IDs across area/bar/line/pie/radar/radial/tooltip, local lazy SVG engine, near-viewport rendering with immediate summary and exact data, range/series/slice controls, point selection, loading/ready/partial/empty/error/disabled, inherited theme and resize updates, disconnect cleanup | 70-recipe geometry and catalog interactions checked in Chromium desktop/phone; fetching, cancellation, recovery, localization and summary accuracy remain host-owned; native-device verification is separate |
| Reading strip | Documented | primary and supporting readings, semantic tones, overflow-safe labels, mobile horizontal sequence | Interactive readings remain host-owned |
| Money and delta | Built | tabular digits, gain/loss/flat direction, signed delta arrow, pending placeholder that reserves its width | Locale and currency formatting remain host-owned |
| Stat | Built | label, display value, movement foot, optional sparkline, direction-tinted spark, auto-fit row, two-up on phones | Comparison against a benchmark series pending |
| Leaderboard table | Built | rank column, top-three emphasis, rank movement, viewer's own row | Tie handling and pagination remain host-owned |
| Plate | Built | mark, spot, scene and banner scales, caption, empty-state placement | Illustration assets remain product-owned |
| Module | Built | head, display value with unit, note, contained scroll region | Extracted from Slow and Steady; sticky heads within a module pending |
| Labelled bars | Built | name, track, fill, gain/loss/warning/neutral data tones, target marker, over state, tabular value, phone reflow | Extracted from Slow and Steady; stacked series pending |
| Calendar | Built | weekday heads, day states (good, over, active, empty, future), today ring, legend | Extracted from Slow and Steady; range selection and multi-month remain host-owned |
| Dense table | Documented | alignment, status, overflow shell, sticky header, selected row, labelled stacked records on phones | Virtualization pending |
| Table toolbar and column menu | Documented | header and footer bars, selection bar in place of the toolbar, column sort menus over the anchored menu, `aria-sort` | Column hiding and reorder remain host-owned |
| View tabs | Documented | counted views, roving focus, arrows, Home/End, horizontal scroll, `controls` panel naming | Overflow menu for very long strips pending |
| Filter chips | Documented | active and resting chips, per-chip menu, clear affordance, Escape and outside close, phone sheet | Saved filter sets pending |
| Anchored menu | Tested | native top-layer popover, menu/menuitem semantics, Arrow/Home/End focus, selection closure, outside click, Escape, short-table clipping protection | Nested menus intentionally unsupported |
| Inline disclosure | Tested | expanded, collapsed, keyboard | Animated height intentionally omitted |
| Expressive state | Documented | empty, loading, error, compact local state | Product-specific illustrations remain host-owned |
| Toast stack | Tested | polite, assertive, timeout, manual dismiss | Cross-tab synchronization out of scope |
| Global search | Tested | authored grouped results, filtering, Ctrl/Cmd+K, arrow result navigation, preserved input Home/End, empty state, desktop dialog, phone full-screen surface | Remote fetching, abort, and product routing remain host-owned |
| Modal task drawer | Tested | native dialog focus containment, opener restore, coordinate-checked backdrop and Escape close, scroll body, sticky safe-area footer, phone full-screen surface | Dirty-state close prevention and conflict policy remain host-owned |
| Tooltip | Tested | hoverable hover/focus labels, Escape dismissal, rail labels | Touch help requires adjacent visible language |
| App shell / mobile navigation | Documented | rail shell, topbar, purposeful mobile nav, responsive rail transformation | Product-specific nav selection remains host-owned |
| MossLayout | Documented | 1/2/3/4/12 column grids, token gaps, child spans, align and justify options, default phone collapse | Container queries, ordering, and product-specific regions remain host-owned |
| Panel / toolbar | Documented | header, body, footer, wrapping toolbar | Drag/reorder out of scope |
| Badge / progress | Documented | semantic tones, neutral badge, square analytical meter | Indeterminate progress pending |
| Switch | Documented | native checkbox and role=switch, checked, disabled, busy | Product persistence and asynchronous state remain host-owned |
| Tabs | Tested | click, arrows, Home/End, nested tab isolation, keyboard overflow reveal | URL routing remains host-owned |
| Segmented control | Built | pressed-state markup and shared styling | State changes and disabled behavior remain host-owned and untested |
| Dialog | Tested | native focus behavior, Escape, coordinate-checked backdrop, accessible title recipe, explicit close | Destructive recipe documentation pending |
| Tree / code / details | Documented | nested tree, code toolbar, key-value rows | Virtualization and editing pending |
| Theme toggle | Adopted | icon-only sun/moon slider, pressed state, permanent accessible name | Host decides whether to expose system mode separately |
| Icon and icon packs | Tested | 34 semantic names, Iconoir default pack, runtime pack swap, decorative and labeled | Requires JavaScript; no icon renders without it |
| Select / dropdown | Documented | label, help, error, disabled, native option menu | Single-select contract intentionally remains distinct from token multi-select |
| Hero | Documented | message, actions, supporting proof, container-aware narrow-host transformation | Product imagery remains product-owned |
| Tokenizing multi-select | Tested | authored suggestions, filtering, token add/remove, duplicate prevention, Enter, arrows, Escape, empty results, phone suggestion sheet | Remote request and native form serialization remain host-owned |
| Described choice cards | Documented | native radio semantics, descriptions, selected, disabled, stacked phone layout | Validation-summary placement remains host-owned |
| Preset date range and comparison | Documented | native preset radios, explicit start/end, comparison switch, timezone summary, phone reflow | Date arithmetic, partial periods, locale, and timezone policy remain host-owned |
| Numbered pagination | Documented | native links, current page, previous/next relations, ellipsis, range summary, compact phone treatment | Result focus and route/query restoration remain host-owned |
| Breadcrumbs | Documented | native hierarchy links, current item, long-name truncation, compact phone ancestry | Moved-object recovery remains host-owned |
| Review and confirm | Documented | exact change summary, correction links, consequence copy, final action, sticky phone actions | Server conflict and revalidation remain host-owned |
| Linear wizard | Built | ordered authored steps, native constraint validation, Back/Continue, progress text, step focus | Cancellable server checkpoints, persistence, and deep links remain pending |
| Structural skeleton | Documented | text and block shapes, busy-region recipe, reduced-motion and forced-color treatment | Timeout and replacement policy remain host-owned |
| Dense audit log | Documented | caption and headers, exact time, actor, event, target ID, redaction text, timezone, labelled phone rows | Filtering, export, and immutable storage remain host-owned |
| Native file picker row | Tested | native picker, accept hint, selected filename, clear and reselect, picker-first phone treatment | Byte validation and upload lifecycle remain host-owned |
| Triage queue with inspector | Documented | queue/current item/inspector composition, desktop split surface, phone list/detail modes | Product routing, stale selection, and scroll restoration require adoption proof |
| Evidence workspace | Documented | conclusion-first header, exact readings, failed gate, source context, prioritized phone order | Evidence loading, permission, and conflict handling require adoption proof |

## Candidate decision round

The selection record remains in `docs/options.html`. A rendered option is not a built, tested, or documented Moss component. Brandon selected the directions below on 2026-09-24; selection promoted the interaction model into implementation work, not automatic adoption. Configuration remains product-owned.

| Component | Status | Compared directions | Known gaps |
|---|---|---|---|
| Combobox and suggestions | Tested | 01C tokenizing multi-select | Remote request and form submission contracts remain host-owned |
| Choice group | Documented | 02B described choice cards | Validation summary remains host-owned |
| Date and range input | Documented | 03C preset plus comparison | Date arithmetic and timezone policy remain host-owned |
| Result navigation | Documented | 04A numbered pages | Routing and result focus remain host-owned |
| Context navigation | Documented | 05A breadcrumb trail | Moved-object recovery remains host-owned |
| Form structure and validation | Documented | 07C review and confirm | Conflict handling remains host-owned |
| Task flow and lifecycle | Built | 09A linear wizard | Cancellable server checkpoints, resume, and deep links remain pending |
| Loading and partial progress | Documented | 10A structural skeleton | Timeout policy remains host-owned |
| Activity and audit | Documented | 11B dense audit log | Filtering and export remain host-owned |
| File upload and import | Tested | 12A native picker row | Validation and upload lifecycle remain host-owned |
| Triage workspace | Documented | 13A queue plus inspector | Composition only; needs product proof before shared extraction |
| Object detail workspace | Documented | 14B evidence workspace | Composition only; needs product proof before shared extraction |
| Setup and configuration workspace | Proposed | 15P keep product-owned / defer | No shared implementation planned from this round |

## Adoption

| Product | Status | Notes |
|---|---|---|
| MCP dashboard | Adopted | Pinned runtime, product theme, semantic bridge, shell, rail, narrative modules, fields, and feedback surfaces deployed |
| Agent harness / Terrarium | Adopted | Pinned runtime, poison-dart theme, semantic bridge, expandable rail, and responsive navigation deployed |
| Trading Agent | Adopted | Pinned runtime, poison-dart theme, density control, expandable rail, dashboard and research foundations deployed |
| Ledger | Adopted | Pinned runtime, Ledger theme, semantic bridge, rail labels, responsive shell, shared controls, narrative trend, reading strip, and the filtered transactions table (view tabs, filter chips, column menus, stacked phone records) |

View tabs and filter chips graduated from Ledger's transactions view on one adoption rather than two, because the
pattern they replace - a detached filter panel with a submit button - is the one Moss most wants products to stop
rebuilding. Their contract is provisional until a second surface proves it; the debts table and the MCP policy
browser are the expected candidates, and a shape that only Ledger needs should return to Ledger.

Product-owned compositions remain intentional where their domain meaning is stronger than a generic primitive. Current examples are Ledger's calendar, envelope, debt visualization, and assistant conversation; MCP's policy browser and benchmark rendering; and Trading Agent's readiness gates and review council. Repeated patterns should graduate into Moss only after a second real adoption proves the shared contract.
