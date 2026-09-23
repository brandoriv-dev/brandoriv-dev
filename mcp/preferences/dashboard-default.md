# Dashboard Default

Use when I invoke `/dashboard-default` or explicitly ask for my default dashboard or function-app interface. Combine this with `frontend-design`; it is a starting composition, not a skin for unrelated data.

Build the first screen around the user's present state and next decision, not around the database schema. If nothing changed since the last visit, do not manufacture an update.

Use this information sequence when it fits the task:

1. A concise signal strip for meaningful changes, exceptions, or required attention.
2. One dominant visualization or working object that answers the primary question.
3. A small, deliberately varied set of supporting modules.
4. Exact records, tables, logs, and configuration on demand.

Do not lead with equally weighted KPI cards unless comparing those KPIs is the main task. Establish priority through scale, position, contrast, and content.

## Dashboard grammar

Use a familiar application shell. Choose rail, sidebar, top navigation, or bottom navigation from the information architecture and viewport. Preserve the viewer's choice when that preference is useful and reliable.

Operational dashboards may use a viewport-height shell with independently scrolling panels when persistent controls and live monitoring justify it. Analytical and content-heavy dashboards may use page scrolling. Test short laptop viewports and phone layouts rather than enforcing one scrolling model.

The dominant module should combine context with the visualization or working surface that explains it. Charts lead only when they communicate the answer faster than a table; exact data remains available nearby.

Supporting modules should answer different questions and may use different forms. Prefer meaningful asymmetry over a repeated grid. Do not add chart variety for decoration.

## Acceptance gate

Before calling the interface complete:

- State the primary question and the dominant object that answers it.
- Verify one clear visual priority and no wall of equally loud cards.
- Make changes and exceptions visible without making stable state noisy.
- Run the reskin test and identify what makes the structure product-specific.
- Render relevant populated, empty, loading, error, stale, permission, and long-content states.
- Inspect representative desktop and phone screenshots in supported themes.
- Confirm mobile retains primary navigation and the dominant task.
- Test keyboard navigation, visible focus, contrast, reduced motion, overflow, and touch targets.

For explicit redesigns, structural hierarchy is in scope. Do not preserve a weak card grid merely because exchanging colors, fonts, icons, or radii would produce a smaller diff.
