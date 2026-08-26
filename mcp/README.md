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
- V1 is read-only.

This intentionally uses the same Cloudflare host to reduce cost. It does not use C#/ASP.NET Core because the current host is Cloudflare Workers, not a .NET application host.

## Capabilities

Tools:

- `list_preference_categories`
- `get_preferences`
- `get_guidance`

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
bun run build
```

Run the Worker locally after building Astro output:

```bash
bun run build
bunx wrangler dev
```

Health check:

```bash
curl http://localhost:8787/mcp/health
```

MCP requests must include the bearer token.

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

## Connecting Codex

Configure Codex with:

```text
URL: https://brandoriv.dev/mcp
Authorization: Bearer <token>
```

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
- The same-host Cloudflare implementation is TypeScript, not C#.

## Future Improvements

- OAuth or per-client tokens.
- Better relevance scoring.
- Versioned preference history.
- Approval-based preference edits.
- Separate .NET implementation if you later choose a .NET host.
