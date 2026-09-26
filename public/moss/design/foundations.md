# Moss foundations

## Design intent

Moss should feel like warm infrastructure: precise and operational without becoming sterile. The interface is a tool rather than a hurdle. It should be readable at a glance, reveal depth when requested, and make the useful action obvious.

When values conflict, prefer clarity, then efficiency, then personality.

## Approved direction

- **Surface:** living charcoal. Large surfaces are neutral dark gray with faint organic warmth. Product accent colors do not tint every surface.
- **Navigation:** a persistent rail on capable screens. The rail can expand and collapse. Collapsed destinations expose labels on hover and keyboard focus. Products may persist the user's preference.
- **Actions:** precise rectangular controls with restrained softness.
- **Fields:** conventionally framed and permanently labeled.
- **Signals:** icon and language communicate meaning before color.
- **Data composition:** narrative first. State the conclusion and connect it directly to evidence; exact data follows on demand.
- **Disclosure:** reveal short supporting detail inline. Use an inspector or dedicated page only as object size and identity require.
- **Typography:** a unified humanist sans-serif system. Monospace is reserved for values, identifiers, shortcuts, timestamps, and machine-readable detail.
- **Density:** balanced by default with comfortable and compact modes available.
- **Tables:** dense instruments for exact comparison, not the default dashboard composition.
- **Charts:** annotated narratives. Important events are labeled on the evidence.
- **Overlays:** anchored menus for short contextual actions.
- **System states:** small expressive markers with an obvious next useful action.
- **Responsive behavior:** purposeful transformation rather than desktop stacking. Rails become task-appropriate mobile navigation; inspectors commonly become sheets; secondary data may move behind disclosure.
- **Icons:** mixed emphasis. Utility icons remain quiet; important concepts may use filled or semantic markers. Icons are inline SVG referenced by semantic name, never text glyphs, so the whole family can be replaced without touching a component. See [`icons.md`](icons.md).

## Color

Color may create atmosphere, but its primary job is to improve comprehension. Charts can use several accents when each color has a stable semantic, categorical, or comparative role. Never make all positive, interactive, decorative, and brand elements the same green.

Applications define product accents through the `--moss-accent-*` tokens. Status colors retain stable meanings. Communicate status with text or iconography as well as color.

## Geometry

Prefer rectangles with modest corner treatment. Controls must not feel sharp, but unrelated elements should not all become pills. Analytical bars are square or nearly square. Softer shapes are reserved for touch targets, friendly states, and objects whose identity benefits from them.

## Accessibility baseline

Target WCAG 2.2 AA. Keyboard access, visible focus, sufficient contrast, reduced motion, semantic labels, and non-color status cues are part of the component contract rather than optional refinements.
