# Frontend Design Preferences

Use for new interfaces, substantial visual redesigns, dashboards, landing pages, and design-system work.

## Workflow

1. Identify the user's task, the product's objects, and the decisions each screen supports.
2. Establish familiar navigation and interaction patterns, then add distinction from the domain, data, workflow, or brand.
3. Set one clear visual priority. Keep detail close without presenting every decision at once.
4. Design real, long, empty, loading, error, stale, permission, keyboard, reduced-motion, desktop, and mobile states that matter to the workflow.
5. Render representative screenshots and critique the result, not only the source.

## Personal defaults

- Use balanced density and neutral layered surfaces. In dark themes, prefer layered dark grays over pure black or a brand-tinted canvas.
- Evergreen is the preferred personal accent, not a wash. Give every color a semantic, categorical, selection, hierarchy, or data role, and never rely on color alone.
- Keep component geometry and data geometry separate. Do not propagate one corner radius or decorative treatment to every object.
- Use gradients, glass, shadow, icons, illustration, monospace, and motion only when they serve a specific function. Respect reduced motion.
- Use inline expansion for short additions, an inspector for a modest object, a dedicated view for a complex object, and context menus for secondary actions.

## Information and charts

Choose a visualization only when it answers the question faster than prose or a table. Select chart form from the comparison: time, magnitude, distribution, composition, relationship, or sequence. Keep exact values available when they matter. Do not add decorative data or chart variety.

Use local confirmation for reversible actions and ordinary success; interrupt with confirmation only for consequential actions that are difficult to undo.

## Anti-template check

Every visible choice needs a reason grounded in the task, data, domain, brand, accessibility, or platform behavior. Avoid card walls, repeated feature grids, ornamental headings, glow, glass, generic icon tiles, implausible placeholder data, and decorative copy when they substitute for product-specific structure.

Patterns are not banned. Use cards for independent objects, pills for compact states or filters, gradients for meaningful progression, and conventional layouts when familiarity reduces effort.

Run a reskin test before completion: if changing only the logo, accent, and nouns could turn the result into an unrelated product, make the structure, content, or interactions more specific.

## Interface copy

Name objects as users recognize them and controls by what they do. Keep action names consistent through progress, success, and errors. Explain failures plainly and provide the next available action.
