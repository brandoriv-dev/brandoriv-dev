# brandoriv.dev

Personal portfolio for **Brandon Rivera** — a Columbus, OH .NET / full-stack
developer. Built to introduce prospective local clients to the kind of web and
custom-software work I do.

The whole page is styled as a maker's **green cutting mat**: every section is a
sheet of eggshell paper taped to the mat, with a few stationery props for
personality. All reading happens on paper (never on the green) so text stays
high-contrast and accessible.

## Stack

- **[Astro 7](https://astro.build)** — static, near-zero client JS
- **[Tailwind CSS v4](https://tailwindcss.com)** via the `@tailwindcss/vite` plugin
- **[Bun](https://bun.sh)** for installs + scripts
- Self-hosted fonts (Fontsource): Bitter (slab display), IBM Plex Sans (body),
  JetBrains Mono (labels), Permanent Marker (handwriting)
- `@astrojs/sitemap` for SEO

## Develop

```bash
bun install
bun run dev        # http://localhost:4321
bun run build      # astro check (types) + astro build → dist/
bun run preview    # serve the production build
```

## Personal MCP server

This repo also contains a read-only personal MCP server under `mcp/`. It serves
Brandon's AI coding-agent working preferences at `https://brandoriv.dev/mcp`
using the same Cloudflare Worker/static-assets deployment as the portfolio. A
browser request to that URL opens the protected MCP evaluation dashboard.

See [mcp/README.md](mcp/README.md) for architecture, authentication, local
development, deployment, client setup, and preference editing.

MCP engineering guidance requires shared contract changes to update their README or
runbook and exercise every known downstream application. Its
[project-context boundary](mcp/README.md#shared-contracts-and-project-context)
keeps volatile Harness inventory out of the always-on prompt.

## Project layout

```
src/
  data/         profile.ts · projects.ts · history.ts   ← all site content lives here
  styles/       global.css                              ← tokens + tactile component classes
  layouts/      Layout.astro                            ← head/SEO/meta/JSON-LD + scripts
  components/   MatBackground, Nav, PaperCard, TapeLabel, RegistrationMarks,
                SectionHeading, TimelineItem, TearLine, Icon, Hero, About,
                History, Projects, Contact, Footer
  pages/        index.astro · thanks.astro
public/         paper-texture.svg · Brandon-Rivera-Resume.pdf · robots.txt ·
                favicon.svg · og-image.png
src/assets/     cutting-mat-bg.jpg  (optimized by astro:assets at build)
```

**Editing content:** everything—headline, hero metrics, projects, skills,
timeline, links—lives in `src/data/`. Edit those `.ts` files; the components
render from them.

**Parked props:** earlier decorations (floating pens, coffee stain, hero
polaroids + `Polaroid.astro`) were removed as dead code after the hero rework.
If you want any of them back, they're one `git revert` away — see commits
`b3dbc65` / `e0edad0` and the cleanup commit that removed them.

## One thing to finish setup

The contact form uses [Web3Forms](https://web3forms.com) (free, no backend).

1. Go to web3forms.com, enter **brandoriv.dev@gmail.com**, and copy the access key they email you.
2. `cp .env.example .env` and set `PUBLIC_WEB3FORMS_KEY` to that key.
3. On your host, add the same `PUBLIC_WEB3FORMS_KEY` as a build environment variable.

Until the key is set, the form posts but won't deliver — the visible email,
LinkedIn, GitHub, and résumé links in the Contact section are the fallback.

## Shipping a change

Work happens on `dev`; `main` is what's live at brandoriv.dev.

```bash
git checkout dev
# make your edit, e.g. swap public/Brandon-Rivera-Resume.pdf
git add -A && git commit -m "..."
git push origin dev
gh pr create --base main --head dev --title "..." --body "..."
gh pr merge --merge          # or merge the PR on github.com
```

Cloudflare is wired to auto-deploy on push to `main` (configured on
Cloudflare's side, not by a workflow file) — merging the PR is enough,
no manual `wrangler deploy` needed. It can take a minute or two to propagate;
if a change hasn't shown up after that, deploy manually (see below) rather
than assuming auto-deploy is broken.

`.github/workflows/ci.yml` runs the MCP check suites plus the smoke test on
every pull request, and again on `main` after merge. It needs no secrets:
Cloudflare does the deploying, Actions only reports pass/fail.

### Deferred: branch protection on `main`

CI reports status but cannot block a merge. Cloudflare deploys `main` without
waiting for Actions, so a red PR merged anyway still ships. The fix is a rule
on `main` requiring `Policy and dashboard checks` and `MCP smoke test`, but
both classic branch protection and rulesets return:

```text
403 Upgrade to GitHub Pro or make this repository public
```

`brandoriv-dev` is private on the Free plan, where protected branches apply
only to public repositories. Unblocking costs $4/month (GitHub Pro), or make
the repo public.

Deferred deliberately on 2026-09-10. With a single committer, protection only
guards against merging a red PR that is already visibly red, and it would not
have caught the failure that actually happened: a week of uncommitted work
while production served code that existed in no commit.

Revisit when any of these becomes true:

- an Arbor agent, or any automation, gets push access to this repo
- a second person starts committing
- you notice yourself merging without reading the checks

The ruleset JSON is straightforward — requiring the two check contexts above —
so this is a one-command change once the plan allows it.

**Updating the résumé specifically:** just overwrite
`public/Brandon-Rivera-Resume.pdf` with the new file (same filename — no
code change needed, see the comment on `profile.resume` in
`src/data/profile.ts`), then follow the steps above.

## Deploy

Static output (`dist/`) — host-agnostic. `site` is set to `https://brandoriv.dev`.

- **Cloudflare (current setup):** `wrangler.jsonc` deploys `dist/` as
  static assets. Auto-deploys on push to `main` (see "Shipping a change").
  To deploy manually instead: `bun run build`, then `wrangler deploy`,
  with `PUBLIC_WEB3FORMS_KEY` set as a build env var.
- **GitHub Pages:** add a deploy workflow using `withastro/action` and set the
  custom domain in the repo settings.

## Regenerating the OG image

`public/og-image.png` (1200×630) is a static social-share card. To regenerate it
after a copy change, recreate the one-off `sharp` script described in the project
history, or edit the PNG directly.

## Accessibility & performance notes

- All body text sits on eggshell paper (~15:1 contrast); the green is decorative.
- Honors `prefers-reduced-motion` (parallax, reveals, and the intro screen are
  all disabled).
- The terminal-style intro only plays on the home page, once per browser session.
- The heavy cutting-mat photo is optimized to a ~1920px WebP via `astro:assets`;
  a CSS grid base paints instantly behind it.
- `/thanks` is `noindex` and excluded from the sitemap.
