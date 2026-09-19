# Frontend Design Preferences

Use for new interfaces, substantial visual redesigns, dashboards, landing pages, and design-system work.

## Product shape

Start with the user's task, the product's objects, and the decisions each screen supports. Use familiar interaction and navigation patterns as the foundation. Add distinction where it explains the product's specific subject, data, or workflow.

Keep the first view readable at a glance and limit the number of simultaneous decisions. Do not remove useful capability to manufacture simplicity. Follow the visual information-seeking sequence: overview first, zoom and filter, then details on demand. Use inline expansion for short additions, an inspector for a modest object, a dedicated page for a complex object, and context menus for secondary actions.

Favor balanced density: compact enough to feel capable, with whitespace used to separate and group rather than to signal luxury. The interface should feel like a tool, not a hurdle. Support desktop and mobile as first-class experiences. Desktop navigation may adapt to the task; prefer visible bottom navigation for primary mobile destinations when the product supports it.

## Visual language

Use neutral surfaces by default. In dark themes, prefer layered dark grays over pure black or a brand-tinted canvas. Let color earn a role: state, category, selection, hierarchy, data, or a genuinely important action. Keep semantic meanings consistent and never rely on color alone.

Evergreen is the preferred personal accent, not a wash for the entire product. Use multiple accents when they distinguish real categories. Choose sequential, diverging, categorical, or highlight palettes according to the data. Do not color a neutral trend green merely because it rises.

Use mostly rectangular geometry with occasional softness; avoid sharp or hostile edges. Component geometry and data geometry are separate systems. A container may be rounded while bars, axes, and analytical marks remain square when that improves comparison. Do not propagate one corner radius to every object.

Use gradients, glass, shadow, borders, icons, illustration, and monospace type when they have a job. Prefer a slightly editorial sans-serif for the main voice and reserve monospace for data, codes, shortcuts, or technical metadata. Motion should be quiet, polished, and tactile. Respect reduced motion.

## Information and charts

Lead data-heavy views with visualizations and offer tables for exact inspection. Select the chart from the question: line or area for change over time, bars for comparison, distribution plots for spread, composition charts for part-to-whole, networks for relationships, and timelines for sequence. Mix chart types only when the underlying questions differ. Every chart must help a user decide, compare, notice, or act; decorative data is not acceptable.

Make personalization proportional to its value and maintenance cost. Remember useful preferences such as density, pins, recent views, sidebar state, columns, and shortcuts when the product can support them reliably. Make keyboard shortcuts and a command palette discoverable without making them prerequisites.

Use local confirmation for reversible actions and a toast for ordinary success. Ask for confirmation only when an action is consequential and not easily undone. Empty, loading, and onboarding states may show noticeable personality, but they must still direct the next action.

## Avoid AI-shaped design

Every visible choice must be owned by the user's task, data, domain, brand, accessibility needs, or platform behavior. `Modern`, `clean`, and `premium` are not sufficient reasons.

Avoid these defaults unless the product specifically earns them:

- Brand-colored or purple-blue gradients spread across the whole interface.
- A rounded card around every section, metric, or sentence.
- Identical three-column feature grids and perfectly repeated compositions.
- Oversized centered headings, decorative eyebrow labels, floating orbs, glow, and glass used as identity substitutes.
- Generic icons in colored rounded squares, decorative charts, and implausibly tidy placeholder data.
- Excessive negative space, identical corner radii, uniform animation, and perfect symmetry.
- Interface copy such as `unlock insights`, `supercharge`, `seamless`, and other claims that do not name an action or outcome.

Do not ban a pattern merely because AI often produces it. Require a reason. Use cards for independent objects, pills for compact states or filters, gradients for depth or meaningful progression, and conventional layouts when familiarity reduces effort.

Before considering the design complete, run a reskin test: if changing only the logo, accent color, and nouns could turn it into an unrelated product, make the structure, content, or interactions more specific. Test real and long content, empty data, loading, errors, permissions, keyboard focus, small screens, and reduced motion. Take screenshots at representative desktop and mobile widths and critique the rendered result, not only the source.

## Interface copy

Name objects by what users recognize and controls by what they do. Keep an action's name consistent through buttons, progress, success, and errors. Prefer `Save changes` to `Submit`. Explain failures plainly and give the next available action. Let labels label and examples demonstrate; do not use copy as decoration.
