# Dashboard Default

Use when I invoke `/dashboard-default` or explicitly ask for my default dashboard or function-app interface. Combine this rule with `frontend-design`; this is the preferred starting composition, not a skin to paste over unrelated data.

## Working surface

Build the first screen around the user's present state and the next decision, not around the database schema. Open with a short editorial heading, one sentence of orientation, and at most one primary action. If nothing changed since the last visit, do not manufacture an update.

Use this information sequence:

1. A concise signal strip for meaningful changes, exceptions, or required attention.
2. One dominant visualization or working object that answers the screen's primary question.
3. A small, deliberately varied set of supporting modules.
4. Exact records, tables, logs, and configuration on demand.

Do not lead with a row of equally weighted KPI cards unless comparing those KPIs is itself the user's main task. Avoid grids of interchangeable cards. Establish visual priority through scale, position, contrast, and content—not by wrapping every fact in a container.

## Dashboard grammar

Use a familiar application shell. On wide screens, prefer a persistent task-oriented sidebar or an adaptive rail. On small screens, keep primary destinations visible with bottom navigation when there are roughly three to five; move secondary utilities to contextual menus. Search or a command palette may sit in the top bar when the product has enough objects or commands to justify it.

The dominant module should combine context and visualization: a current value or state, its relevant comparison, and the chart or working surface that explains it. Use square or nearly square analytical marks even when the surrounding container is softly rounded. Charts lead when they communicate a trend, comparison, composition, relationship, or sequence more quickly than a table; exact data remains available nearby.

Supporting modules should answer different questions and may therefore use different forms. Prefer meaningful asymmetry over a perfectly repeated grid. Examples include a compact bar comparison, composition view, relationship map, event timeline, ranked list, or actionable exception list. Do not add chart variety merely for decoration.

Keep surfaces neutral and layered. Evergreen is an accent for selection, progress, health, or a primary action—not the canvas. Give additional accents strict semantic or categorical roles. Dark mode uses charcoal and layered gray rather than pure black or a green wash.

## Interaction

Show a few decisions at once while keeping detail close. Expand short information inline, use an inspector for a modest object, and navigate to a dedicated view for a complex object. Context menus hold secondary actions. Ordinary success uses a brief toast; confirmation is reserved for consequential actions that are not easily undone.

Motion is quiet and tactile: short state transitions, restrained chart reveals, and clear hover or pressed feedback. Respect reduced motion. Keyboard focus, shortcuts, loading, empty, error, stale-data, permission, and long-content states are part of the design, not cleanup work.

## Acceptance gate

Before calling the interface complete:

- State the primary question and the dominant object that answers it.
- Verify the first viewport has one clear visual priority and no wall of equally loud cards.
- Check that changes and exceptions are visible without making stable state noisy.
- Run the reskin test and explain what makes the structure specific to this product.
- Render representative populated, empty, loading, error, and long-content states.
- Inspect desktop and phone screenshots in light and dark themes.
- Confirm mobile retains primary navigation and the dominant task rather than merely stacking the desktop page.
- Test keyboard navigation, visible focus, contrast, reduced motion, overflow, and touch targets.

When adapting an existing dashboard, structural hierarchy is in scope. Do not interpret “smallest safe change” as permission to preserve a weak card grid or merely exchange colors, fonts, icons, and corner radii.
