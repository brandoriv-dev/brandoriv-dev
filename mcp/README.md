# brandoriv.dev MCP

This is a small read-only MCP server for Brandon Rivera's personal AI-agent working preferences.

The intended public endpoint is:

```text
https://brandoriv.dev/mcp
```

## Architecture

- The portfolio site remains a static Astro site.
- Cloudflare Workers Static Assets serves `dist/`.
- `mcp/worker.ts` handles the MCP transport, dashboard API, and `/mcp/health`.
- Browser navigation to `/mcp` serves the static dashboard from `src/pages/mcp/index.astro`; MCP requests continue to use the same URL through HTTP content negotiation.
- All other paths fall back to the static Astro assets through the `ASSETS` binding.
- The MCP server uses `agents/mcp/server` with `@modelcontextprotocol/server@2`.
- The transport is stateless Streamable HTTP.
- The endpoint supports MCP protocol `2026-07-28` plus stateless `2025-11-25`, `2025-06-18`, and `2025-03-26` compatibility for clients that still use `initialize`.
- V1 is read-only.

This intentionally uses the same Cloudflare host to reduce cost. It does not use C#/ASP.NET Core because the current host is Cloudflare Workers, not a .NET application host.

## Capabilities

Tools:

- `list_preference_categories`
- `get_preferences` retrieves one category, or every category only when `category="all"` is explicitly requested for an audit.
- `get_guidance` is the normal entry point and returns the always-on baseline (global, communication, unslop, code-style) plus at most six automatically selected task categories. Engineering guidance is selected for implementation and architecture work, or as the fallback when no category matches. Task modes and technology domains outrank generic matches.

The MCP initialization response carries the always-on baseline in its `instructions` field, so every client on every device receives it at connect time with no tool call and no per-machine setup. The first 512 characters are a self-contained bootstrap that names `get_guidance`, for Codex, which shows only that much; the four baseline categories follow. Clients that ignore `instructions` still get the baseline from `get_guidance`.

Rules that must shape every response therefore live in the baseline, and the server, not per-device files, is what delivers them. Two of the baseline categories exist for exactly this reason:

- `unslop` is a compressed version of the writing rules, always on, because it governs how every answer is written.
- `code-style` is a short always-on check that tells the agent to identify the language from the files it can see and call `get_preferences` for that language's style category. Keyword routing cannot read the repository, so a task like "fix the null reference in CustomerService" carries no language token and would otherwise route to generic guidance while `csharp-style` sat unused.

This is progressive disclosure: a compact tier delivered unconditionally, with the full `csharp-style` reference pulled on demand.

The baseline deliberately separates execution depth from answer length: agents should spend their available reasoning and context budget on useful investigation, tools, tests, and verification while returning a compact synthesis rather than their working transcript.

Resources:

- `personal://global`
- `personal://communication`
- `personal://code-style`
- `personal://engineering`
- `personal://debugging`
- `personal://dotnet`
- `personal://csharp-style`
- `personal://sql`
- `personal://research`
- `personal://unslop`
- `personal://code-review`

## Preference Storage

Preferences live as Markdown files in `mcp/preferences/`.

### Shared contracts and project context

Engineering guidance treats documentation and consumers as part of a shared
contract. A change to an MCP tool, Harness response, or project metadata shape must
update the nearest README or runbook and test every known downstream application in
the same change. If a consumer cannot be exercised, the change must name that
consumer and the missing verification instead of claiming compatibility.

Harness project facts should be fetched just in time through a small, read-only MCP
tool or resource when that integration is added. Do not copy changing costs, health,
deployment IDs, or repository state into the always-on prompt. Responses should be
project-scoped, timestamped, and limited to safe links and identifiers; they must
exclude credentials, local filesystem paths, raw cloud inventories, and personal
data. Harness remains the source of truth, and MCP output is an observation with
freshness metadata rather than authority to deploy, trade, or mutate a project.

For a future Harness project-context contract, verification must cover the producer
schema, MCP serialization and authorization, task routing, the `/mcp` page, the
`/harness` dashboard, and every named client or worker consuming the response. Run
a live smoke test after deployment and record the operation under `mcp/changes/`;
cross-link `Azure/changes/` when Azure also changes.

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

### Dashboard Session

Opening `https://brandoriv.dev/mcp` in a browser shows a private operational dashboard. The primary sign-in is a personal Microsoft account; the MCP bearer token remains available under "Use the MCP bearer token instead" as a break-glass path. Either way the Worker issues the same eight-hour HMAC-signed session cookie with `HttpOnly`, `Secure`, `SameSite=Strict`, and `Path=/`. The bearer token is not placed in browser storage, a URL, or the session cookie. It is shown on the authenticated Connect view, masked until revealed, so a new device can be set up from anywhere; that makes a Microsoft sign-in equivalent to holding the token, which is accepted.

**Microsoft sign-in** is the OpenID Connect authorization-code flow with PKCE, implemented in `mcp/microsoft-auth.ts` against the consumers endpoint (`login.microsoftonline.com/consumers`). `GET /mcp/auth/login` stores state, nonce, and the PKCE verifier in a ten-minute signed cookie and redirects to Microsoft. `GET /mcp/auth/callback` checks the state, exchanges the code, validates the `id_token` (RS256 against Microsoft's JWKS, issuer, audience, expiry, nonce), and grants a session only if the account's email is in `DASHBOARD_ALLOWED_EMAILS`. Anyone else who signs in at Microsoft is redirected back with `?login=denied`. The account's `oid` is logged on each sign-in so the allowlist can later be pinned to it, which is stronger than email.

Configuration: `MICROSOFT_CLIENT_ID` and `DASHBOARD_ALLOWED_EMAILS` are plain vars in `wrangler.jsonc`; `MICROSOFT_CLIENT_SECRET` is a Cloudflare secret set with `bunx wrangler secret put MICROSOFT_CLIENT_SECRET`. The Entra app registration must list `https://brandoriv.dev/mcp/auth/callback` as a Web redirect URI and allow personal Microsoft accounts. The Worker pins that redirect URI rather than deriving it from the request, because OAuth requires an exact match and wrangler dev rewrites request hosts.

MCP clients are not involved in any of this: `/mcp` is bearer-only and Cloudflare Access is deliberately not used, since it would intercept agent traffic on the same path.

The HTML shell is public, but evaluation data and policy content come from `/mcp/dashboard/data` only after session validation. The shell uses a restrictive Content Security Policy and is not cacheable. Logout expires the browser cookie. MCP clients remain bearer-authenticated and do not use the dashboard cookie. Present browser `Origin` headers on the MCP transport are validated against the site's own hostnames; normal server-side clients omit that header.

`bun run mcp:auth-test` exercises the OIDC module with locally generated RSA keys: signature verification, forged claims, `alg=none`, replayed nonce, wrong audience and issuer, expiry, state-cookie tampering, and the allowlist.

## Local Development

Install dependencies:

```bash
bun install
```

Run checks:

```bash
bun run mcp:check
bun run mcp:auth-test
bun run mcp:dashboard-test
bun run mcp:routing-test
bun run mcp:policy-eval
bun run build
```

`mcp:dashboard-test` checks session signing, expiry, tamper rejection, cookie hardening, canonical metadata, and the evaluation snapshot's labels and provenance.

`mcp:routing-test` checks task routing, category limits, false-positive keyword matches, inflected intent terms, and delivery of the TL;DR and official-documentation rules.

`mcp:policy-eval` compares the current policy against the frozen baseline in `mcp/policy-baseline.json` across a representative task corpus. It requires no aggregate growth in JSON-serialized MCP result size, no unexplained per-case growth, all route-applicable regex patterns to match, and zero lost baseline pattern matches. These deterministic transport-size and pattern-presence checks do not prove semantic completeness or model-answer quality.

`mcp:policy-eval --print-report` prints the computed report without checking it against `mcp/evaluation.ts`, and `--payloads` prints the raw serialized results for external tokenizing.

### Re-baselining

`policy-baseline.json` holds the frozen policy text and category definitions; `policy-baseline.mjs` holds a hand-frozen copy of the routing algorithm from `routing.ts`. Freezing both means a change to either the prose or the routing shows up as a measured delta instead of moving silently with the code under test.

To accept the current policy as the new reference point:

```bash
bun run mcp:rebaseline          # rewrites policy-baseline.json from the live policy
bun run mcp:policy-eval --print-report
```

Copy the printed figures into `mcp/evaluation.ts`, then run `bun run mcp:policy-eval` to confirm the staleness gates pass. If `routing.ts` changed shape, update the frozen algorithm in `policy-baseline.mjs` in the same commit. Re-baselining discards the previous comparison, so do it deliberately.

When changing preference prose, also compare representative simple-answer, debugging, architecture, research, and code-review tasks. Accept lower token usage only when correctness, decisive evidence, material caveats or uncertainty, verification status, and actionable next steps remain intact.

### Evaluation Snapshot

The baseline was re-frozen at v1.5.0 after moving unslop and code-style into the always-on baseline, so the frozen baseline and the live policy are the same artifact and every deterministic comparison is zero by construction. Run `bun run mcp:policy-eval --print-report` for the current byte and pattern figures.

**The previous v1-to-v1.2 evaluation is withdrawn.** It recorded a 40.3% drop in serialized results, but that reduction came from removing guidance from `structuredContent` — the field that clients surfacing structured output actually read. The measured saving was the guidance itself going missing: `get_guidance` returned category ids and no policy while every check still reported success. The eval never caught it because `policy-eval.mjs` reconstructs a tool result rather than importing `server.ts`, and the smoke test asserted only on `content[0].text`. Both now assert on the client-visible path.

Model-answer quality has not been re-measured against this baseline. The `serializedResultTokens`, `visibleAnswerTokens`, `blindJudge`, and `strictJudge` fields in `mcp/evaluation.ts` are zeroed and labelled pending rather than carrying forward figures that described the withdrawn comparison. Re-running that study needs fresh-context trials with retained prompts, outputs, and judge transcripts; tokenize `bun run mcp:policy-eval --payloads` to refresh the token counts.

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

The smoke test verifies browser content negotiation, dashboard headers, streamed-body limits, trusted and rejected Origins, accepted and rejected sessions, protected data, logout, and health metadata. It repeats the full tool checks while pinning `2026-07-28`, `2025-11-25`, `2025-06-18`, and `2025-03-26`. It refuses to send the token over cleartext except to a loopback host and never prints the bearer token.

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
- Browser `GET /mcp` requests that accept HTML receive the dashboard shell.
- `/mcp/dashboard/session` and `/mcp/dashboard/data` run the private dashboard API.
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

Keep the token in an environment variable and add this to `~/.codex/config.toml`:

```toml
[mcp_servers.brandoriv]
url = "https://brandoriv.dev/mcp"
bearer_token_env_var = "MCP_BEARER_TOKEN"
```

Launch Codex from an environment where `MCP_BEARER_TOKEN` is available. The token value is not stored in `config.toml`. This follows the current [official Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).

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

Keep the token in `MCP_BEARER_TOKEN` and add a remote HTTP server to `.mcp.json`:

```json
{
  "mcpServers": {
    "brandoriv": {
      "type": "http",
      "url": "https://brandoriv.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${MCP_BEARER_TOKEN}"
      }
    }
  }
}
```

This uses Claude Code's documented environment-variable expansion so the token is not committed. See the current [official Claude Code MCP documentation](https://code.claude.com/docs/en/mcp).

Tiny bootstrap instruction:

```text
Use the brandoriv.dev MCP server as the canonical source for Brandon's coding-agent preferences.
```

## New Computer Setup

1. Install the AI coding client.
2. Add remote MCP server `https://brandoriv.dev/mcp`.
3. Add the bearer token: sign in to `https://brandoriv.dev/mcp` with Microsoft, open Connect, and copy it.
4. Add a tiny bootstrap instruction telling the client to call `get_guidance`.
5. Start working.

## Known Limitations

- V1 uses one shared bearer token.
- V1 has no OAuth, token rotation workflow, or audit log.
- The dashboard session cookie is still signed with the shared bearer token, so rotating that token ends every browser session.
- Logout clears the current browser's cookie but cannot revoke a copied stateless session before its eight-hour expiry; rotating the bearer secret invalidates every session.
- V1 preferences are edited through git and deployment.
- The relevance filter is keyword-based, not semantic search.
- ChatGPT, Claude, Cursor, and Codex all use `https://brandoriv.dev/mcp` with the same bearer token. Codex can use `2026-07-28`; clients on the 2025 `initialize` handshake use the compatibility lane.
- Guidance can request deep reasoning, but the client controls provider-specific effort and token-budget settings.
- The same-host Cloudflare implementation is TypeScript, not C#.

## Future Improvements

- Pin the dashboard allowlist to the account `oid` instead of email.
- Standards-based MCP OAuth for agent clients.
- Better relevance scoring.
- Versioned preference history.
- Approval-based preference edits.
- Separate .NET implementation if you later choose a .NET host.
