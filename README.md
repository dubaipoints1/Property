# dubaipoints.ae

UAE-focused points and miles site — credit card analysis, loyalty programs, and deals for the GCC traveller.

Built with Astro 5, TypeScript (strict), Tailwind 4, MDX, and Pagefind. Deployed to Cloudflare Pages.

## Stack

- **Astro 5** with Content Collections (Content Layer API) and MDX
- **TypeScript** strict mode
- **Tailwind 4** via the Vite plugin (CSS-first config in `src/styles/global.css`)
- **Pagefind** for client-side search (post-build)
- **Cloudflare Pages** for hosting + Cloudflare Web Analytics
- **Firecrawl** + GitHub Actions for bank product scraping (Phase 2)

## Develop

```bash
nvm use            # Node 20
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs dist/ + runs Pagefind
npm run check      # astro check (TS + content schema validation)
```

## Project status

Currently in **Phase 1**: scaffold + Zod content schemas. See `PLAN.md` for the full multi-phase roadmap.
