# brandoriv.dev MCP

This is a small read-only MCP server for Brandon Rivera's personal AI-agent working preferences.

The intended public endpoint is:

```text
https://brandoriv.dev/mcp
```

## Architecture

- The portfolio site remains a static Astro site.
- Cloudflare Workers Static Assets serves `dist/`.
- `mcp/worker.ts` handles `/mcp` and `/mcp/health`.
- All other paths fall back to the static Astro assets through the `ASSETS` binding.
- The MCP server uses `agents/mcp/server` with `@modelcontextprotocol/server@2`.
- The transport is stateless Streamable HTTP.
- The endpoint supports MCP protocol `2026-07-28` and a stateless 2025 compatibility lane for Cursor, Claude, and ChatGPT clients that still use `initialize`.
- V1 is read-only.

This intentionally uses the same Cloudflare host to reduce cost. It does not use C#/ASP.NET Core because the current host is Cloudflare Workers, not a .NET application host.

## Capabilities

Tools:

- `list_preference_categories`
- `get_preferences` retrieves one category, or every category only when `category="all"` is explicitly requested for an audit.
- `get_guidance` is the normal entry point and returns the compact global, communication, and engineering baseline plus at most five automatically selected task categories. Task modes and technology domains outrank generic matches.

The MCP initialization response also tells compatible clients to call `get_guidance` before substantive technical work. The core instruction is kept self-contained within the first 512 characters for Codex compatibility.

The baseline deliberately separates execution depth from answer length: agents should spend their available reasoning and context budget on useful investigation, tools, tests, and verification while returning a compact synthesis rather than their working transcript.

Resources:

- `personal://global`
- `personal://communication`
- `personal://engineering`
- `personal://debugging`
- `personal://dotnet`
- `personal://sql`
- `personal://research`
- `personal://code-review`

## Preference Storage

Preferences live as Markdown files in `mcp/preferences/`.

To edit preferences:

1. Edit the relevant Markdown file.
2. Run `bun run build`.
3. Commit and deploy through the normal site flow.

There is no runtime editing in V1. MCP clients cannot rewrite the instructions that guide them.

## Authentication

`/mcp` requires a bearer token:

```http
Authorization: Bearer <token>
```

The token is read from the Cloudflare secret `MCP_BEARER_TOKEN`.

Generate a token locally:

```bash
openssl rand -base64 48
```

Set it in Cloudflare:

```bash
bunx wrangler secret put MCP_BEARER_TOKEN
```

Do not commit the token.

## Local Development

Install dependencies:

```bash
bun install
```

Run checks:

```bash
bun run mcp:check
bun run mcp:routing-test
bun run build
```

`mcp:routing-test` checks task routing, category limits, false-positive keyword matches, inflected intent terms, and delivery of the TL;DR and official-documentation rules. It is a deterministic routing test, not a model-behavior evaluation.

When changing preference prose, also compare representative simple-answer, debugging, architecture, research, and code-review tasks. Accept lower token usage only when correctness, decisive evidence, material caveats or uncertainty, verification status, and actionable next steps remain intact.

Design references: [OpenAI Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp), [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model), [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), [Google prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies), [MCP server specification](https://modelcontextprotocol.io/specification/latest/server), and [Cloudflare MCP handler APIs](https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/).

Run the Worker locally after building Astro output:

```bash
bun run build
bunx wrangler dev --local --port 8791 --var MCP_BEARER_TOKEN:local-test-token
```

Health check:

```bash
curl http://127.0.0.1:8791/mcp/health
```

MCP requests must include the bearer token.

Protocol smoke test against a running Worker:

```powershell
$env:MCP_URL = "http://127.0.0.1:8791/mcp"
$env:MCP_BEARER_TOKEN = "local-test-token"
bun run mcp:smoke
```

The smoke test pins MCP `2026-07-28`, then repeats the same tool checks on a 2025-era `initialize` client. It refuses to send the token over cleartext except to a loopback host and never prints the bearer token.

## Deployment

The current Cloudflare setup deploys the site from `main`.

Normal flow:

```bash
git checkout dev
git add -A
git commit -m "Add personal MCP server"
git push origin dev
gh pr create --base main --head dev --title "Add personal MCP server" --body "Adds a read-only personal MCP server at /mcp."
gh pr merge --merge
```

Manual deploy:

```bash
bun run deploy
```

Before the first deploy, set:

```bash
bunx wrangler secret put MCP_BEARER_TOKEN
```

## Routing

`wrangler.jsonc` configures a Worker script plus static assets:

- `/mcp` runs the MCP Worker.
- `/mcp/health` runs the health endpoint.
- Everything else serves the Astro site from `dist/`.

No `mcp.brandoriv.dev` subdomain is required for V1.

## Connecting Cursor

Add the remote server in `~/.cursor/mcp.json` (Windows: `%USERPROFILE%\.cursor\mcp.json`):

```json
{
  "mcpServers": {
    "brandoriv-personal-context": {
      "url": "https://brandoriv.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${env:MCP_BEARER_TOKEN}"
      }
    }
  }
}
```

Keep `MCP_BEARER_TOKEN` in the user environment so Cursor can expand it. After saving, reload MCP servers. Cursor still speaks the 2025 Streamable HTTP handshake; the Worker serves that on the same `/mcp` path.

Tiny bootstrap instruction:

```text
Before starting coding work, consult my personal MCP server at https://brandoriv.dev/mcp and use get_guidance for task-specific working preferences.
```

## Connecting Codex

Current Codex builds gate MCP `2026-07-28` support behind a feature flag. Enable it, keep the token in an environment variable, and add the server:

```powershell
codex features enable mcp_2026_07_28
$env:BRANDORIV_MCP_TOKEN = "<token>"
codex mcp add brandoriv-personal-context --url https://brandoriv.dev/mcp --bearer-token-env-var BRANDORIV_MCP_TOKEN
```

Launch Codex from an environment where `BRANDORIV_MCP_TOKEN` is available. The token value is not stored in `config.toml`.

Tiny bootstrap instruction:

```text
Before starting coding work, consult my personal MCP server at https://brandoriv.dev/mcp and use get_guidance for task-specific working preferences.
```

## Connecting ChatGPT

ChatGPT custom connectors / developer MCP use the same Streamable HTTP URL and bearer token:

```text
URL: https://brandoriv.dev/mcp
Authorization: Bearer <token>
```

If ChatGPT asks for OAuth instead of a static bearer token, that is a ChatGPT connector requirement, not a missing `/mcp` path. V1 still uses one shared bearer token.

Tiny bootstrap instruction:

```text
Before starting coding work, consult my personal MCP server at https://brandoriv.dev/mcp and use get_guidance for task-specific working preferences.
```

## Connecting Claude Code

Configure Claude Code with a remote MCP server:

```text
URL: https://brandoriv.dev/mcp
Authorization: Bearer <token>
```

Tiny bootstrap instruction:

```text
Use the brandoriv.dev MCP server as the canonical source for Brandon's coding-agent preferences.
```

Exact Claude Code CLI/config syntax can vary by version, so check current Claude Code MCP docs when wiring a new machine.

## New Computer Setup

1. Install the AI coding client.
2. Add remote MCP server `https://brandoriv.dev/mcp`.
3. Add the bearer token.
4. Add a tiny bootstrap instruction telling the client to call `get_guidance`.
5. Start working.

## Known Limitations

- V1 uses one shared bearer token.
- V1 has no OAuth, token rotation workflow, or audit log.
- V1 preferences are edited through git and deployment.
- The relevance filter is keyword-based, not semantic search.
- ChatGPT, Claude, Cursor, and Codex all use `https://brandoriv.dev/mcp` with the same bearer token. Codex pins `2026-07-28`; Cursor and many Claude/ChatGPT clients use the 2025 `initialize` handshake on the compatibility lane.
- Guidance can request deep reasoning, but the client controls provider-specific effort and token-budget settings.
- The same-host Cloudflare implementation is TypeScript, not C#.

## Future Improvements

- OAuth or per-client tokens.
- Better relevance scoring.
- Versioned preference history.
- Approval-based preference edits.
- Separate .NET implementation if you later choose a .NET host.
