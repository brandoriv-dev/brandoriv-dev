# Refine MCP typography

- Event and record date (UTC): 2026-09-14; publication pending.
- Actor: Codex through the owner's website workflow.
- Target: Cloudflare `brandoriv-dev`, `https://brandoriv.dev/mcp`.
- Status: implementation in progress; no deployment is asserted here.

Use the visitor platform's native monospace stack for body copy and operational
data. Use IBM Plex Sans when available, with the system sans-serif stack for
navigation, actions, controls, labels, and headings. This keeps a clear hierarchy
without another font request. Preserve authentication, dashboard content, theme
behavior, and mobile bottom navigation.

Before publication, run the complete build and browser checks in both themes at
desktop and mobile widths, checking font loading, contrast, and overflow. Record
the actual revision, deployment ID, live checks, and rollback afterward. No MCP
policy, secret, identity, Azure, or authentication change is planned.

Rollback: revert only this typography update through a checked PR. No rollback has
been performed. The related Harness publication is tracked in its Azure journal.
