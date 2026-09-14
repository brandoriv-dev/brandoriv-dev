# MCP external changes

Record operations outside Git that affect `https://brandoriv.dev/mcp`: Cloudflare
publication and secrets, Entra application configuration, redirect URIs, account
allowlists, DNS/routes, and recovery actions. Source-only policy edits already have
Git history; record their publication here when it changes the deployed service.

Use the [shared convention](../../Azure/README.md) and
[template](../../Azure/change-template.md). Add a
`YYYY-MM-DD-short-description.md` entry with actual UTC event time, actor, target,
source/action reference, observed outcome, validation evidence, rollback, and any
configuration drift. Distinguish configured intent, attempted operations, and
verified live behavior. Use links to the authoritative Azure or Harness record for
shared operations instead of duplicating them.

For credential changes, record setting names such as `MCP_BEARER_TOKEN` or
`MICROSOFT_CLIENT_SECRET`, the reason, and the result. Never record their values,
authenticated Connect-view contents, session cookies, or full token responses.

- [Authentication configuration baseline, recorded 2026-09-12](2026-09-12-authentication-baseline.md).
- [Shared dark mode publication plan, 2026-09-13](2026-09-13-dark-mode-plan.md).
- [Shared dark mode deployed and checked, 2026-09-13](2026-09-13-dark-mode-deployed.md).
- [Material dark theme and mobile navigation deployed, 2026-09-14](2026-09-14-material-dark-theme-deployed.md).
