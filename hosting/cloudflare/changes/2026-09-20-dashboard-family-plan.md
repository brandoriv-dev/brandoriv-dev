# Dashboard family: antagonistic review and cohesion plan

- Event time (UTC): 2026-09-20
- Recorded on (UTC): 2026-09-20
- Record type: contemporaneous
- Actor: Claude Code on Brandon's behalf; four read-only review agents (one per dashboard plus a cross-dashboard critic)
- Environment and targets: `brandoriv.dev/mcp` (this repository), `brandoriv.dev/harness` (`agent-harness`), Morning Pilot trading dashboard (`robinhood-morning-pilot`)
- Status: plan; Harness and trading restyles applied locally and verified by screenshot, not deployed
- Source/action references: `agent-harness` working tree on `main` after `e604845`; `robinhood-morning-pilot` working tree after `e06d0bd`; this repository on `mascot-brand-refresh` at `f415de7`
- Related records: [Harness restyle](https://github.com/brandoriv-dev/terrarium/blob/main/hosting/harness/changes/2026-09-20-dashboard-family-restyle.md), [trading restyle](https://github.com/brandoriv-dev/bullfrog/blob/main/hosting/azure/changes/2026-09-20-dashboard-family-restyle.md)

## Verdict

Three dashboards, three design systems. The MCP console is closest to the front-end rule and is the base, but is not reference-grade yet: its declared fonts never load and its comparison chart labels a withdrawn v1/v1.2 study. Harness was three overwritten style eras (Georgia, Inter, monospace body; two dark themes). Trading was dark-only, blue-accented, pill-badged, with no theme script and a safety gap: a fired kill switch renders as a green "Live" badge. Blazor/MudBlazor stays out of this pass; all three surfaces are vanilla JS on non-.NET hosts. Carry the token contract into a Blazor app later rather than bringing Blazor here.

## The shared system (decided)

- Family resemblance comes from four things only: the frog mark, the evergreen and teal-ink palette, IBM Plex Sans with JetBrains Mono, and the uppercase mono eyebrow. The portfolio's cutting mat, tape, Bitter, and marker stay on the portfolio; dashboards are tools.
- Tokens: the MCP light/dark set. Surfaces `--canvas/--surface/--surface-soft/--line/--line-strong`; text `--ink/--secondary-ink/--muted`; chrome `--primary` (evergreen); tones `--success-*/--caution-*/--danger(-soft)/--teal(-soft)/--neutral(-soft)`; categorical `--green/--coral/--teal/--amber` with `-soft` pairs; data `--gain/--loss` for numerals only. Mascot hexes are not UI tokens except ink `#0b3b35` and cream `#fff8e9` as text.
- Radii: 6px controls and badges, 8px cards and dialogs, 0 to 2px data marks. No pills on status.
- Status vocabulary, six tones, always word plus hue plus glyph where present: `ok`, `warn`, `danger`, `attention` (teal, "needs you"), `paused`, `neutral`. Trading rule: badge red means the system is broken; numeral red means money lost; never mix.
- Theme: one `theme.js` (the MCP script), key `brandoriv-theme`, control `[data-theme-choice]`, theme-color read from a CSS token. `/mcp` and `/harness` share an origin and sync. The trading host cannot until it is proxied at `brandoriv.dev/trading` through the same Worker path `mcp/harness.ts` already uses.
- Icons: lucide-family glyphs, stroke 1.75, inline SVG. The frog appears at most twice per screen (brand plus one empty state); never on cards, badges, buttons, or as texture.
- Red trading frog: only two fills change, body `#75c653` to `#d94a3c` and cheeks `#ff7548` to `#ffb38a`; crown, eyes, and ink stay so it reads as the same family.
- Delivery: a versioned `design/` folder in this repository, vendored into each repo by a Bun sync script with a hash check. A cross-origin stylesheet is rejected because the trading CSP would need a foreign `style-src`.

## Harness: ranked improvements

1. Project identity was one folder glyph per card and the CSP blocks favicon fetches. Applied: an `icon` field on the project record (`frog`, `frog-red`, `globe`, `repo`, `server`, `bot`, `chart`, `book`), seeded for the three known projects, a monogram tile fallback toned by a stable hash, and the hostname under the name.
2. Planning panel is a dead end above the H1: the form sends only `prompt`, so every plan is `needs-clarification`. Plan: render the four missing fields inline, "Create task from this plan" on `ready`. Applied now: humanised gap labels and copy.
3. Monospace body and three overwritten style layers. Applied: one token block on the MCP palette, Plex body, mono for data, dark as a token swap only.
4. Colour without semantics. Applied: `needs-review` moved from danger to attention, observation mode neutral, budget bar threshold tones, agent marks keyed on `agent.kind` instead of array index, paused and offline dots distinct.
5. "Needs attention" items are not actionable although alert ids encode their subject. Plan: map `run-*`, `budget-*`, `integration-*`, `host-*` to Record outcome, Edit budget, Sync, Connections.
6. Bug: auto-refresh rebuilt `#planning-project` and wiped the selection. Applied: value preserved across renders.
7. Cancel task is irreversible with no confirmation; action names drift. Plan.
8. State v2 objects (purpose, authority mode, outcomes, task planning, lease expiry) are invisible; `/api/events` has no UI. Plan.

## Trading: ranked improvements

1. Kill-switch state invisible: `liveRelease.status`, `armedBy`, `currentDrawdownPercent`, last order are never rendered. Recommended next, before anything cosmetic. The readiness card now carries a `data-state` attribute, including `killed`, so the border tone is ready for it.
2. Arm is one native `confirm()`; the server's typed-phrase gate is satisfied by a client-side constant; Disarm is a secondary button. Plan: inline confirmation with consequences and typed phrase for Arm, one-click prominent Disarm pinned while armed.
3. Green as a wash across brand, buttons, eyebrows, KPI icons, P&L, gates, meters, and cash. Applied: `--accent` for chrome, `--gain/--loss` for numerals, cash allocation neutral, eyebrows muted mono.
4. Red overused: "N gates remaining" was red every day. Applied: pending gates neutral or amber; red reserved for failure.
5. No theme, no reduced motion, 417 KB lucide runtime, generic brand tile. Applied: shared theme script with a light palette, reduced-motion block, red frog inline with no tile. Lucide to sprite is plan.
6. Overview is four KPI plus six identical cards with the audit log last. Plan: split into views with the sidebar and bottom-nav shell.

## MCP console: ranked improvements

1. Fonts never load: `dashboard.css` declares Plex and JetBrains Mono with no `@font-face`; the page does not use `Layout.astro`. Add the fontsource imports and fix the family name (`IBM Plex Sans Variable`).
2. Chart labels say v1 and v1.2; `evaluation.ts` withdrew that comparison. Bind the labels to `evaluation.baseline` and `service.version`.
3. Overview hero is half "Not measured" with real data and shows a zero corpus count as a stat. Collapse unmeasured modules into one line naming the command to run.
4. Routing, the product's mechanism, has no view; the overview fails the reskin test. Add a "describe a task, see which policies ship" panel over a read-only route endpoint.
5. Versioning is the least designed object: plain text history, no active marker, no restore. Add an active marker, expandable rows, "Restore as new version", and an editing banner.
6. 42 of 78 font sizes are 11px or smaller; mobile active nav label is 4.35:1; `viewport-fit=cover` is missing so safe-area insets are zero in standalone mode.
7. Dead mobile drawer CSS and JS still ship; three hardcoded live greens; the brand uses a 1254px PNG at 34px where `favicon.svg` exists.

## Validation and evidence

Harness: `npm test` 91 of 91, `npm run check` clean; screenshots at 1440 and 390 in light and dark from the local preview (Projects, Agents, Add project dialog). Trading: `npm test` 74 of 74; screenshots at 1440 and 390 in light and dark plus the research page. Fonts render as IBM Plex Sans on this machine because it is installed locally; other machines fall back to Segoe UI until the fonts are vendored (needs binary static serving in both Azure apps, which read assets as UTF-8 text today).

## Rollback

`git checkout -- .` in each working tree; nothing is committed or deployed.

## Drift and follow-up

- Vendor the two web fonts in all three hosts (binary static serving in `agent-harness/src/http.js` and `robinhood-morning-pilot/src/functions/app.js`).
- Create `design/` in this repository and the sync script; until then Harness and trading carry hand-copied tokens with the same names.
- Proxy the trading dashboard under `brandoriv.dev/trading` so the theme choice syncs.
- Trading item 1 (kill-switch rendering) and item 2 (arm confirmation) are the next work.
