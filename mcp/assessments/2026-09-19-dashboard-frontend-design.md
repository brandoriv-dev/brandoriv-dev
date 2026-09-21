# MCP dashboard frontend-design assessment

Assessed the authenticated production dashboard at `https://brandoriv.dev/mcp` on 2026-09-19 against `personal://frontend-design`. This is an assessment, not an authorization to change the interface.

## Verdict

The dashboard is already close to the intended character: restrained, information-dense without becoming a wall, responsive, and specific to its job. It passes the functional and responsive portions of the rule. Its largest design debt is typography; pervasive monospace makes long-form policy content harder to read and conflicts with the preference to reserve monospace for data and technical identifiers.

## What works

- **Overview first:** service health, version, routing improvement, pattern coverage, and measurement caveats are legible in one scan. Detailed evidence remains below the fold.
- **Honest visualization:** square-ended comparison bars answer the baseline-versus-current question without decorative chart variety. Missing measurements say “Not measured” rather than implying results.
- **Color discipline:** dark-gray surfaces carry the interface. Evergreen identifies the product and healthy/current states, while coral, cyan, and yellow have distinct supporting roles.
- **Progressive disclosure:** navigation is task-based; the policy browser combines a tree with an adjacent document; major branches collapse; version history and editing remain secondary actions.
- **Responsive structure:** desktop uses a persistent task rail. Mobile moves the same three destinations to a visible bottom bar, keeps the selected policy context near the top, and avoids horizontal page overflow in the inspected viewport.
- **Accessibility foundations:** native buttons, visible text labels, `aria-current`, `aria-pressed`, branch `aria-expanded`, reduced-motion handling, and explicit measurement language are present.
- **Product specificity:** protocol versions, policy provenance, routing benchmarks, read-only tool state, and private-session status make this recognizably an MCP context console rather than a generic admin template.

## Findings to address

1. **Use the editorial sans for prose.** Policy bullets, explanatory copy, navigation, and headings are all rendered with a strongly technical monospace face. Keep monospace for policy URIs, versions, tokens, numbers, and code; use the editorial sans for reading and navigation. This is the clearest improvement to readability and personality.
2. **Make group descriptions retrievable on desktop.** The narrow policy-tree column truncates descriptions such as “Guidance included for every task.” The descriptions establish the hierarchy, so allow a two-line wrap, a wider resizable tree, or a focus/hover disclosure. Do not rely on an inaccessible title-only tooltip.
3. **Clarify the collapse target.** The chevron works and `aria-expanded` is correct, but selecting a group and toggling it are currently one combined click. A separate disclosure control would make branch behavior more predictable without adding another decision to the page.
4. **Reduce header utility prominence on mobile.** Theme, copy, refresh, and exit controls occupy the strongest row while the server name truncates. Preserve the actions, but move low-frequency utilities into a compact overflow treatment or let identity retain more width.
5. **Strengthen tactile state changes.** The interface is polished but nearly static. A brief branch-open transition, pressed state, and content cross-fade—disabled by reduced-motion preference—would better meet the responsive-and-tactile goal without becoming cinematic.

## Rule checks

- Hierarchy and “few choices at once”: **Pass**
- Balanced information density: **Pass**
- Neutral surfaces and semantic accents: **Pass**
- Visualization selected by question: **Pass**
- Progressive disclosure and contextual detail: **Pass with the description-disclosure issue above**
- Desktop/mobile parity: **Pass with a mobile-header refinement**
- Keyboard and accessibility foundations: **Pass; a full manual keyboard/screen-reader audit remains separate work**
- Anti-template/reskin test: **Pass**
- Slightly editorial sans with sparse monospace: **Needs work**

