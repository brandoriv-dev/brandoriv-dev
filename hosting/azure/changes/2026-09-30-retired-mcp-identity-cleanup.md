# Record retired MCP identity cleanup

- Status: applied
- Verified: checked
- Checked: Entra app query returned empty after deletion; no service principal existed; active subscription a3fefd88-bd76-40bf-9f2b-6f87dc707790 contained no MCP-named resources.
- Not checked: nothing
- When (UTC): 2026-09-30T22:03:36Z
- Actor: Codex for Brandon Rivera
- Target: Entra application `2cf1ac79-78e8-4327-afcd-8bb5110c2bb3`

- Previous: Entra app 2cf1ac79-78e8-4327-afcd-8bb5110c2bb3 with one credential and the retired callback
- Deployed: Application e9532d95-f974-4d3e-87d3-df451284981c absent from Entra query

## Intent

Remove the original MCP dashboard identity. The authoritative operation and outcome are recorded in [the MCP journal](../../cloudflare/changes/2026-09-30-clean-retired-mcp-cloud-resources.md).

## Outcome

See the authoritative MCP operation record for execution and verification.
