# MCP frog icon publication plan

- **Status:** Planned
- **Recorded on (UTC):** 2026-09-15
- **Actor:** Codex
- **Target:** `https://brandoriv.dev/mcp`
- **Planned operation:** Publish the user-supplied frog artwork as a public static asset; advertise it in MCP server and tool metadata; use it for the MCP dashboard favicon, touch icon, and install manifest.
- **Source revision:** Pending
- **Verification:** Type checking, dashboard metadata tests, production build, MCP live smoke, and direct public asset checks.
- **Rollback:** Redeploy the previously verified Cloudflare Worker revision.
- **Remaining differences from infrastructure code:** None expected. No DNS, route, identity, secret, Azure, or Cloudflare account configuration changes are planned.

This record covers the MCP component deployment. It does not require an Azure operation record because the target is the existing Cloudflare deployment and no Azure resource changes are involved.
