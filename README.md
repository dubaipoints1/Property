# dubaipoints.ae

UAE-focused points and miles site — credit card analysis, loyalty programs, and deals for the GCC traveller.

Built with Astro 7, TypeScript (strict), Tailwind 4, MDX, and Pagefind. Configured for Cloudflare Pages.

## Stack

- **Astro 7** with Content Collections (Content Layer API) and MDX
- **TypeScript** strict mode
- **Tailwind 4** via the Vite plugin (CSS-first config in `src/styles/global.css`)
- **Pagefind** for client-side search (post-build)
- **Cloudflare Pages** for hosting + Cloudflare Web Analytics
- **Firecrawl** + GitHub Actions for bank product scraping (Phase 2)

## Develop

```bash
nvm use            # Node 22
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs dist/ + runs Pagefind
npm run check      # astro check (TS + content schema validation)
```

## Project status

Pre-publication content build: 55 card records across 12 banks, three live
salary-transfer offers, and a static search index. Internal fixture routes are
removed from the production artefact before Pagefind runs. Publication remains
subject to the Council and Chairman gates in `CLAUDE.md`; `PLAN.md` is retained
as historical roadmap context.
