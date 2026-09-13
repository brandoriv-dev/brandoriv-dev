# Add dark mode to the MCP page

- Event and record date (UTC): 2026-09-13; publication pending.
- Record type: contemporaneous.
- Actor: Codex using the owner's website deployment workflow.
- Target: Cloudflare `brandoriv-dev`, page `https://brandoriv.dev/mcp`.
- Status: implementation in progress; no deployment is asserted.

Add a compact System/Light/Dark preference to the sign-in and console views. The
browser setting `brandoriv-theme` is shared with `/harness`, follows the operating
system when System is selected, and uses an external theme script compatible with
the existing CSP. The portfolio's styling and Microsoft/bearer authentication
flows retain their current behavior. No identity settings or secrets change.

Before publication, verify existing MCP checks and both themes on desktop/mobile,
including form controls, focus, code blocks, and the sign-in/console states. Publish
through the existing PR and Cloudflare build workflow; record the actual revision,
deployment ID, UTC time, and live checks in a completion entry.

Rollback: revert only this page's theme implementation through a new PR and verify
the previous authenticated page behavior. No rollback has been performed. There
is no planned infrastructure drift; this change is represented by tracked assets.
The Harness page's corresponding deployment is tracked in the private Harness
repository's `Azure/changes/2026-09-13-dashboard-and-theme-plan.md`.
