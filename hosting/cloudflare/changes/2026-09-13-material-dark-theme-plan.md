# Refine MCP hierarchy and dark theme

- Event and record date (UTC): 2026-09-13; publication pending.
- Actor: Codex through the owner's website workflow.
- Target: Cloudflare `brandoriv-dev`, `https://brandoriv.dev/mcp`.
- Status: implementation in progress; no deployment is asserted here.

Replace the green-tinted dark canvas with neutral Material-style layers, keeping
evergreen for action, focus, selected navigation, and healthy state. Preserve the
Overview, Policies, Connect sequence: current state, governing behavior, then setup.
On phones, expose those three destinations as a direct bottom tab bar instead of a
hidden drawer. Keep sign-in compact and preserve all authentication behavior.

Before publication, run the full build and browser checks in both themes at desktop
and mobile widths, including focus, contrast, overflow, view navigation, persistence,
and signed-out/authenticated fixtures. Record the actual revision, deployment ID,
UTC time, live verification, and rollback afterward. No MCP policy, identity,
secret, Azure, or authentication change is planned.

Rollback: revert only this presentation update through a checked PR. No rollback
has been performed. The related Harness publication is tracked in its Azure journal.
