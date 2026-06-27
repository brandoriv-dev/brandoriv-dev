# brandoriv.dev

Personal portfolio for **Brandon Rivera** — a Columbus, OH .NET / full-stack
developer. Built to introduce prospective local clients to the kind of web and
custom-software work I do.

The whole page is styled as a maker's **green cutting mat**: every section is a
sheet of eggshell paper taped to the mat, with polaroids and a few stationery
props for personality. All reading happens on paper (never on the green) so text
stays high-contrast and accessible.

## Stack

- **[Astro 5](https://astro.build)** — static, near-zero client JS
- **[Tailwind CSS v4](https://tailwindcss.com)** via the `@tailwindcss/vite` plugin
- **[Bun](https://bun.sh)** for installs + scripts
- Self-hosted fonts (Fontsource): Instrument Serif, Inter, JetBrains Mono, Permanent Marker
- `@astrojs/sitemap` for SEO

## Develop

```bash
bun install
bun run dev        # http://localhost:4321
bun run build      # astro check (types) + astro build → dist/
bun run preview    # serve the production build
```

## Project layout

```
src/
  data/         profile.ts · projects.ts · history.ts   ← all site content lives here
  styles/       global.css                              ← tokens + tactile component classes
  layouts/      Layout.astro                            ← head/SEO/meta/JSON-LD + scripts
  components/   MatBackground, Nav, PaperCard, TapeLabel, RegistrationMarks,
                Polaroid, SectionHeading, Hero, About, History, Projects,
                Contact, Footer
  pages/        index.astro · thanks.astro
public/         cutting-mat.svg · Brandon-Rivera-Resume.pdf · CNAME ·
                robots.txt · favicon.svg · og-image.png · photos/
src/assets/     cutting-mat-bg.jpg  (optimized by astro:assets at build)
```

**Editing content:** everything—headline, projects, skills, timeline, links—lives
in `src/data/`. Edit those `.ts` files; the components render from them.

## Two things to finish setup

### 1. Real photos

The hero shows three placeholder polaroids. Replace the files in
[`public/photos/`](public/photos/) (`polaroid-1.svg`, `polaroid-2.svg`,
`polaroid-3.svg`) with real photos. If you use `.jpg`/`.png`, update the `src`
paths and captions in [`src/components/Hero.astro`](src/components/Hero.astro).

### 2. Contact form key

The contact form uses [Web3Forms](https://web3forms.com) (free, no backend).

1. Go to web3forms.com, enter **brandoriv.dev@gmail.com**, and copy the access key they email you.
2. `cp .env.example .env` and set `PUBLIC_WEB3FORMS_KEY` to that key.
3. On your host, add the same `PUBLIC_WEB3FORMS_KEY` as a build environment variable.

Until the key is set, the form posts but won't deliver — the visible email,
LinkedIn, GitHub, and résumé links in the Contact section are the fallback.

## Deploy

Static output (`dist/`) — host-agnostic. `site` is set to `https://brandoriv.dev`.

- **GitHub Pages:** `public/CNAME` already targets `brandoriv.dev`. Add a deploy
  workflow using `withastro/action`.
- **Cloudflare Pages:** build command `bun run build`, output directory `dist`,
  set the custom domain in the dashboard, and add `PUBLIC_WEB3FORMS_KEY` as an env var.

## Regenerating the OG image

`public/og-image.png` (1200×630) is a static social-share card. To regenerate it
after a copy change, recreate the one-off `sharp` script described in the project
history, or edit the PNG directly.

## Accessibility & performance notes

- All body text sits on eggshell paper (~15:1 contrast); the green is decorative.
- Honors `prefers-reduced-motion` (parallax + reveal animations disabled).
- The heavy cutting-mat photo is optimized to a ~1920px WebP via `astro:assets`;
  a CSS grid base paints instantly behind it.
- Scattered props are hidden on small screens so mobile stays clean and fast.
