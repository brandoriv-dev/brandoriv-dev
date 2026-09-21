# MCP frog icon deployed

- **Status:** Completed
- **UTC time:** 2026-09-19T16:46:46Z
- **Actor:** Codex, through the configured GitHub and Cloudflare deployment identities
- **Target:** `https://brandoriv.dev/mcp`
- **Planned operation:** [MCP frog icon publication plan](2026-09-14-mcp-icon-plan.md)
- **Source revision:** `af12e66`, merged to `main` as `43c6fbd3caf085f10c05ff15a9c253c42ac34864`
- **Pull request:** [#32](https://github.com/BrandoRiv/brandoriv-dev/pull/32)
- **Cloudflare build:** `743a9b23-99ef-40a1-9342-af2ab98197c5`
- **Cloudflare deployment:** `807f6cea-5da4-48f1-a8db-ba94bb1313dd`
- **Cloudflare version:** `957b0a0f-c7c0-4062-bd87-bb14f1a6c2e6`
- **Outcome:** The user-supplied frog artwork is public at `/mcp/brandoriv-mcp-icon.png`. MCP version 1.8.0 advertises it in server initialization and every tool definition. The `/mcp` dashboard uses it as its favicon, Apple touch icon, and installable web-app icon.
- **Verification:** PR and merged-main Policy and dashboard checks, MCP smoke test, and Cloudflare Workers build all passed. The full local build passed, including type checking, 36 Microsoft authentication checks, 30 dashboard checks, 34 routing checks, 13 Harness proxy cases, policy evaluation, Astro checks, and the production build. The authentication tamper test also passed 50 consecutive runs after its mutation was made deterministic. Live production checks returned the PNG with HTTP 200 and `image/png`, returned the web manifest with the frog icon, reported service version 1.8.0, and passed the authenticated smoke suite across all four supported MCP protocol dates. Each live initialization response contained the canonical icon URL, and every tool advertised the same icon.
- **Rollback:** Redeploy merge `8702ff12dfcfcff1c04070a8363a35a4b8ac6ca2` or Cloudflare deployment `b355fe81-efb9-4523-bb66-0f493cfdecd4`.
- **Remaining differences from infrastructure code:** None. No DNS, route, secret, Entra, Azure, or Cloudflare account configuration changed. Whether a particular chat client renders protocol icon metadata remains a client behavior; the server now supplies the supported metadata and public asset correctly.

This is the authoritative MCP component record for the publication. No Azure record is required because the operation changed only the existing Cloudflare-hosted MCP application and its versioned static assets.
