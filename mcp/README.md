# brandoriv.dev MCP

The original service is retired as of 2026-09-30. Production sets
`MCP_RETIRED=true`: `/mcp` and every `/mcp/` subroute return HTTP 410
for all methods before authentication or tool execution. Stored policies and
credentials are retained. The setup instructions below describe the historical
service. Local development keeps the service available unless this flag is set.
To restore it, set `MCP_RETIRED=false` and republish the Worker.

This is a small MCP server for Brandon Rivera's personal AI-agent working preferences.

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
- Server initialization and every tool advertise the public frog icon at `https://brandoriv.dev/mcp/brandoriv-mcp-icon.png`. Clients decide whether to render MCP icon metadata and may instead use a connector icon configured in their own UI.
- MCP tools remain read-only. The authenticated owner dashboard can create policy versions.

This intentionally uses the same Cloudflare host to reduce cost. It does not use C#/ASP.NET Core because the current host is Cloudflare Workers, not a .NET application host.

## Capabilities

Tools:

- `list_preference_categories`
- `get_preferences` retrieves one category, or every category only when `category="all"` is explicitly requested for an audit.
- `get_guidance` is the normal entry point. It returns the compact always-on baseline plus inferred task, language, framework, artifact, and explicitly requested policies in one call. Explicit categories augment inferred guidance. Unknown tasks receive only the baseline rather than defaulting to code guidance.
- `grill-me` is an explicit command workflow with its own catalog identity and prompt. Commands are not preference categories.

The MCP initialization response carries the always-on baseline in its `instructions` field, so every client on every device receives it at connect time with no tool call and no per-machine setup. The first 512 characters are a self-contained bootstrap that names `get_guidance`; the two baseline categories follow. Clients that ignore `instructions` still get the baseline from `get_guidance`.

Rules that genuinely shape every response live in the baseline. Specialized writing,
workflow, language, framework, and data rules are progressively disclosed only when
the router or an explicit category request selects them.

The baseline deliberately separates execution depth from answer length: investigation and verification scale with risk while the response stays concise and outcome-first.

Routed policies follow the same progressive-disclosure principles as portable
Agent Skills: keep activation metadata compact, load one coherent workflow when it
applies, retain concrete procedures and gotchas for fragile tasks, and omit generic
advice a capable agent already knows. See the
[Agent Skills authoring guidance](https://agentskills.io/skill-creation/best-practices),
[Anthropic best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices),
and [Anthropic's maintained skill creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md).

Each catalog node also records `reviewedAt`, `relatedSkills`, and `relatedTools`.
The authenticated dashboard derives an age in days from `reviewedAt` and shows the
capabilities associated with the selected rule. This inventory is operational
metadata only: it is not appended to `get_guidance`, so tracking rule freshness and
client capabilities does not increase normal agent-guidance payloads. Capability
names document expected integrations; they do not claim that every client has a
named skill installed or an MCP server authenticated.

Resources:

- `personal://global`
- `personal://communication`
- `personal://engineering`
- `personal://frontend-design`
- `personal://debugging`
- `personal://dotnet`
- `personal://csharp-style`
- `personal://typescript-javascript`
- `personal://python`
- `personal://powershell`
- `personal://infrastructure-as-code`
- `personal://sql`
- `personal://research`
- `personal://unslop`
- `personal://code-review`

### Frontend design

`personal://frontend-design` is a routed policy under the dashboard's **Design**
group. It activates for interface, website, dashboard, responsive-layout,
design-system, and data-visualization work. It keeps neutral surfaces and familiar
interaction patterns as the foundation; routes detail according to object
complexity; selects chart and color semantics from the question being answered;
and requires each distinctive choice to come from the product rather than a
generic AI-design default.

The rule is not part of the always-on initialization baseline. Clients receive it
through `get_guidance` only when task text, language, framework, or an explicit
category request selects it.

## Preference Storage

Preferences live as Markdown files in `mcp/preferences/`.

### Grill me

`/grill-me` starts a stateless design interview adapted from
[Matt Pocock's grill-me and grilling skills](https://github.com/mattpocock/skills/tree/main/skills/productivity).
It maps the idea as a decision tree, asks only the currently unblocked questions,
includes a recommended answer with each question, and waits after each round. The
agent researches available facts; the user decides intent and tradeoffs. It stops
before implementation and finishes only after every reachable branch is examined
and the user confirms the resulting shared understanding.

This version lives in MCP guidance so connected clients can use the same behavior.
It does not write `CONTEXT.md`, ADRs, plans, or code unless the user makes a
separate request. Invoke it explicitly with `/grill-me`, `/grill me`, or “grill
me on …”.

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

The dashboard presents these policies as a collapsible tree, gives each major
group a short UI-only description, and keeps commands in a separate branch. Group
descriptions organize the dashboard and are not returned as agent guidance. With
the optional `MCP_POLICIES` KV binding configured, an authenticated
dashboard save creates an immutable version record, appends version history, and
makes the new version active. MCP tools read already-routable policy content from
the active pointer at request time. Initialization text, routing predicates,
category metadata, and new categories are compiled into the Worker and still
require deployment. Without the binding, repository policies remain readable and
the editor is deliberately disabled.

To edit the repository baseline:

1. Edit the relevant Markdown file.
2. Run `bun run build`.
3. Commit and deploy through the normal site flow.

MCP clients cannot rewrite the instructions that guide them. Only the authenticated
owner dashboard exposes the versioned mutation endpoint.

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

The dashboard uses the same frog artwork for its browser favicon, Apple touch icon, and web app manifest. Installing the `/mcp` page from a compatible browser therefore carries the MCP identity to a desktop or home-screen shortcut.

**Microsoft sign-in** is the OpenID Connect authorization-code flow with PKCE, implemented in `mcp/microsoft-auth.ts` against the consumers endpoint (`login.microsoftonline.com/consumers`). `GET /mcp/auth/login` stores state, nonce, and the PKCE verifier in a ten-minute signed cookie and redirects to Microsoft. `GET /mcp/auth/callback` checks the state, exchanges the code, validates the `id_token` (RS256 against Microsoft's JWKS, issuer, audience, expiry, nonce), and grants a session only if the account's email is in `DASHBOARD_ALLOWED_EMAILS`. Anyone else who signs in at Microsoft is redirected back with `?login=denied`. The account's `oid` is logged on each sign-in so the allowlist can later be pinned to it, which is stronger than email.

Configuration: `MICROSOFT_CLIENT_ID` and `DASHBOARD_ALLOWED_EMAILS` are plain vars in `wrangler.jsonc`; `MICROSOFT_CLIENT_SECRET` is a Cloudflare secret set with `bunx wrangler secret put MICROSOFT_CLIENT_SECRET`. The Entra app registration must list `https://brandoriv.dev/mcp/auth/callback` as a Web redirect URI and allow personal Microsoft accounts. The Worker pins that redirect URI rather than deriving it from the request, because OAuth requires an exact match and wrangler dev rewrites request hosts.

MCP clients are not involved in any of this: `/mcp` is bearer-only and Cloudflare Access is deliberately not used, since it would intercept agent traffic on the same path.

The HTML shell is public, but evaluation data and policy content come from `/mcp/dashboard/data` only after session validation. The shell uses a restrictive Content Security Policy and is not cacheable. Logout expires the browser cookie. MCP clients remain bearer-authenticated and do not use the dashboard cookie. Present browser `Origin` headers on the MCP transport are validated against the site's own hostnames; normal server-side clients omit that header.

`bun run mcp:auth-test` exercises the OIDC module with locally generated RSA keys: signature verification, forged claims, `alg=none`, replayed nonce, wrong audience and issuer, expiry, state-cookie tampering, and the allowlist.

## Jev Shadow Routing and Event Logging

`get_guidance` keeps deterministic routing authoritative. Jev can run only as an opt-in shadow classifier that compares its candidate categories to the deterministic selection and logs the result. Shadow output is not used to choose delivered guidance.

Runtime settings:

- `JEV_ROUTING_MODE`: `off` or `shadow`; defaults to `off`.
- `TYPESAFE_API_KEY`: secret used for TypeSafe/Jev calls. Do not commit it.
- `TYPESAFE_ENDPOINT`: TypeSafe endpoint. The default configured value is `https://api.typesafe.ai/v1/systemone`.
- `TYPESAFE_MODEL`: TypeSafe model. The default configured value is `jev-latest`.
- `JEV_ROUTE_THRESHOLD`: global Jev category threshold; defaults to `0.65`.
- `JEV_SEND_RAW_TASK`: `0` keeps raw task text out of Jev requests; `1` explicitly opts in to sending raw task, language, framework, and artifact values.
- `JEV_TIMEOUT_MS`: Jev shadow-call timeout; defaults to `1500`.
- `BSTACK_TOOLS_EVENT_ENDPOINT`: event ingestion endpoint. It is currently shaped for `bstack.tools/api/v0/feedback` and can also carry future `visualize` events.
- `BSTACK_TOOLS_EVENT_TOKEN`: secret bearer token for event ingestion.

For the live Cloudflare Worker, `TYPESAFE_API_KEY` and `BSTACK_TOOLS_EVENT_TOKEN` are Cloudflare secrets:

```bash
bunx wrangler secret put TYPESAFE_API_KEY
bunx wrangler secret put BSTACK_TOOLS_EVENT_TOKEN
```

Azure Key Vault and Azure App Configuration can be the external source of truth for the same settings. The Worker does not read Azure directly at request time; deployment automation or an operator must mirror the Key Vault secret and App Configuration values into the Cloudflare Worker settings before enabling `JEV_ROUTING_MODE=shadow`.

The current source-of-truth stance is intentionally conservative:

- Azure Key Vault is the owner-managed source for `TYPESAFE_API_KEY` and, if event ingestion needs a bearer token, `BSTACK_TOOLS_EVENT_TOKEN`.
- Azure App Configuration is the owner-managed source for the non-secret Jev and event endpoint settings.
- Cloudflare Worker vars and secrets remain the runtime source because the Worker cannot read Azure at request time.
- Mirroring is manual for now. GitHub Actions or deploy-time secret sync would add another privileged path across Azure and Cloudflare before this feature has proved it needs that complexity.

Manual mirror flow:

1. Update Azure Key Vault and Azure App Configuration first. Keep `JEV_ROUTING_MODE=off` and `JEV_SEND_RAW_TASK=0` unless explicitly changing those controls.
2. Mirror non-secret values into `wrangler.jsonc` or Cloudflare Worker vars, preserving the safe defaults committed here.
3. Mirror secrets with Wrangler prompts so values are never stored in shell history or repository files:

   ```bash
   bunx wrangler secret put TYPESAFE_API_KEY
   bunx wrangler secret put BSTACK_TOOLS_EVENT_TOKEN
   ```

4. Run the repository audit:

   ```bash
   bun run mcp:config-audit
   ```

5. When authenticated to the Cloudflare account, also check live secret names:

   ```bash
   bun run mcp:config-audit:live
   ```

The live audit checks only secret names returned by Cloudflare. It does not read or print secret values. Missing settings are reported by name and fail closed.

Do not add cross-cloud sync automation until deployment ownership changes or repeated manual rotations justify it. If automation is added later, prefer a narrowly scoped manual GitHub Actions workflow using Azure OIDC, a Cloudflare token limited to `brandoriv-dev` Worker settings, masked stdin writes to `wrangler secret put`, and a dry-run/audit mode that reports only setting names.

## Local Development

Install dependencies:

```bash
bun install
```

Run checks:

```bash
bun run mcp:check
bun run mcp:auth-test
bun run mcp:config-audit
bun run mcp:dashboard-test
bun run mcp:event-log-test
bun run mcp:jev-test
bun run mcp:routing-test
bun run mcp:policy-eval
bun run build
```

`mcp:dashboard-test` checks session signing, expiry, tamper rejection, cookie hardening, canonical metadata, and the evaluation snapshot's labels and provenance.

`mcp:routing-test` checks task routing, false-positive keyword matches, explicit-category augmentation, catalog identity uniqueness, command separation, and core policy delivery.

`mcp:policy-eval` compares the current policy against the frozen baseline in `mcp/policy-baseline.json` across a representative task corpus. It rejects unexplained per-case payload growth and reports transport size plus diagnostic regex-presence counts. Phrase presence is not treated as compliance or quality evidence.

`mcp:token-test` adds deterministic `o200k_base` token counts for the complete JSON-serialized tool results and initialization instructions. These are reproducible payload measurements, not provider billing records: clients can select, transform, or cache MCP fields differently. Use provider usage telemetry for billed, cached, reasoning, and output tokens.

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

The frozen v1.5 artifact remains the comparison baseline. The live policy intentionally differs, so deterministic byte, token, and diagnostic phrase-presence figures are nonzero. Run `bun run mcp:policy-eval --print-report` for the current measurements.

**The previous v1-to-v1.2 evaluation is withdrawn.** It recorded a 40.3% drop in serialized results, but that reduction came from removing guidance from `structuredContent` — the field that clients surfacing structured output actually read. The measured saving was the guidance itself going missing: `get_guidance` returned category ids and no policy while every check still reported success. The eval never caught it because `policy-eval.mjs` reconstructs a tool result rather than importing `server.ts`, and the smoke test asserted only on `content[0].text`. Both now assert on the client-visible path.

Model-answer quality was measured for an 8-case sample of the 26-case corpus (`bun run mcp:answer-study`) on 2026-09-21: `visibleAnswerTokens`, `blindJudge`, and `strictJudge` are populated. `serializedResultTokens` remains the separate, always-current deterministic `o200k_base` payload count. The answer-study result is a directional sample, not full-corpus coverage, and its judge model was not a pinned provider model id in this run (see `mcp:answer-study` below) — treat `strictJudge.candidateWins`/`candidateLosses` as suggestive, not decisive, until run with `ANTHROPIC_API_KEY` against the full corpus.

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

### Model-Answer Quality (`mcp:answer-study`)

`mcp:policy-eval` is deterministic and never calls a model; `mcp:answer-study` is the separate, real-model-answer study those deterministic checks deliberately don't attempt. It generates an answer to each corpus task under the baseline policy and the candidate policy, then scores both with an independent blind judge (accept/reject plus hard-defect flag) and a stricter acceptance-plus-preference judge, retaining every prompt, answer, and judge transcript under `mcp/assessments/answer-study/<runId>/`.

It costs real provider usage and is not bit-for-bit reproducible run to run (model sampling varies), so it is not part of the deterministic `mcp:policy-eval` gate and does not run on every commit.

```bash
ANTHROPIC_API_KEY=... bun run mcp:answer-study -- --write
```

Runs the full 26-case corpus by default; set `ANSWER_STUDY_CASES` to run a smaller, front-of-corpus prefix (two runs at the same count compare the same tasks). `ANSWER_STUDY_MODEL` and `ANSWER_STUDY_JUDGE_MODEL` default to `claude-sonnet-5`. `--write` patches only the five answer-study-owned fields in `evaluation.ts` (`corpus.answerPairs`, `visibleAnswerTokens`, `visibleAnswerWords`, `blindJudge`, `strictJudge`, `provenance.modelAnswerSample`); it never touches the deterministic fields `mcp:policy-eval` owns.

```bash
bun run mcp:answer-study -- --aggregate <runId> --write
```

Re-scores an already-retained run's transcripts through the same aggregation code without calling the API again — used to check a claimed result, or to apply a run whose transcripts were produced some other way (this repository's own coding agent stood in for the API for the `2026-09-20-session-agent-run-1` sample, recorded in `mcp/assessments/answer-study/2026-09-20-session-agent-run-1/`, since no `ANTHROPIC_API_KEY` was configured in that session).

`.github/workflows/answer-study.yml` is manual-trigger only (`workflow_dispatch`) for now, deliberately not wired to run on every push to `main` — pushes happen regularly here, and firing a paid live-API run on each one was premature. It is a no-op unless `ANTHROPIC_API_KEY` is set as a repository secret. When run, it opens a PR with the refreshed `evaluation.ts` and retained transcripts rather than pushing directly, defaults to an 8-case sample (`vars.ANSWER_STUDY_CASES`), and re-runs the deterministic suites against the new snapshot before opening the PR. Add a `push: branches: [main]` trigger back once automatic-on-merge is actually wanted.

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
