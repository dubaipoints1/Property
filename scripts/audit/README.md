# Audit harness (opt-in)

Reproducible probes behind the 2026-09-06 site UI/UX audit
(`.council/research/2026-09/site-audit-uiux-2026-09-06.md`). Every earlier
contrast, overflow or Lighthouse claim in `.council/` was produced by eye or by
an ad-hoc session and could not be re-run; these scripts are the recurrence
guard, in the same spirit as `scripts/ci/check-links.mjs`.

Nothing here runs in `build`, `postbuild` or `pr-checks`. Outputs land in the
gitignored `audit-output/`; curated JSON for a filed audit is copied by hand to
`.council/research/<month>/<audit>-evidence/`.

## Prerequisites

- Node per `.nvmrc`; `npm install` (playwright 1.56.1, axe-core, lighthouse 13,
  chrome-launcher, http-server are devDependencies).
- A Chromium build. The Claude Code web session has build 1194 pre-installed
  under `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, which is exactly the build
  playwright 1.56.1 expects — that is why the pin is exact. On a workstation run
  `npx playwright install chromium` once, or point `DP_CHROME_PATH` at any
  Chrome/Chromium binary.
- `npm run build` first; the probes serve `dist/` themselves on a free port
  (plain `http-server`, no SPA fallback, so a 404 is a real 404).

## Commands

| Script | What it does | Useful flags |
|---|---|---|
| `npm run audit:render` | Playwright + axe over every route in `dist/` at 360/390/768/1024/1280/1440, light and dark: overflow offenders, headings, images, link text, tap targets, focus stops, hamburger keyboard probe, console/network errors, LCP/CLS/DOM/bytes, fonts, reduced-motion, axe violations; fold screenshots at 390 and 1280, full-page for the template sample. Writes `audit-output/render/probes.json` + `summary.md`, one JSON per route (resumable). | `--quick`, `--sample`, `--routes /a/,/b/`, `--match '^/cards/'`, `--limit 5`, `--force`, `--external allow`, `--base https://…` |
| `npm run audit:lighthouse` | Lighthouse 13 (mobile + desktop) over `scripts/audit/routes.sample.json`; `scores.md` + raw LHR per route; `--assert` enforces the Technical Lead budget (mobile ≥ 95, above-fold ≤ 200 KB). | `--routes /`, `--presets mobile`, `--runs 3`, `--html` |
| `npm run audit:links:fragments` | `#anchor` hrefs resolve to an `id` on the target page; root-relative `<form action>` targets exist; warns on GET search forms that post to `/`. | `-- --json audit-output/links/fragments.json` |
| `npm run audit:static` | `public/_redirects` validity (missing targets, chains, loops, shadowed pages), `public/_headers` presence + lint against the recommended baseline (printed as a recommendation only), sitemap vs `dist/` diff, robots.txt. | `-- --strict` |
| `npm run audit:links:external` | Every outbound `<a href>` in `dist/` HEAD/GET-checked with per-host politeness and bot-wall classification. **Only meaningful in GitHub Actions** — the web sandbox's egress allowlist turns nearly every host into `unverifiable/egress-blocked`. | `-- --strict`, `--limit`, `--only-host` |
| `npm run audit:all` | render → lighthouse → fragments → static (local-only set). | |

`.github/workflows/link-audit.yml` runs the external sweep and the fragment
check on a Monday cron and on manual dispatch, uploads `audit-output/links/`
as an artifact, and opens or updates one issue when broken links are found. It
never writes to the repository.

## Reading the output

- `probes.json` is deterministic apart from timing metrics: arrays are sorted,
  numbers rounded, per-item timestamps omitted, screenshots referenced by path.
  Two runs on the same build should differ only in `meta` and `metrics`.
- `meta.externalMode: "block"` means cross-origin requests were aborted (the
  sandbox default): font and beacon failures are recorded as
  `console.externalBlocked`, not as errors. Use `--external allow` where egress
  is unrestricted to measure real font loading.
- Lighthouse numbers from the local server are pessimistic (uncompressed, no
  CDN). Take the production figure with `--base https://dubaipoints.ae` from a
  machine that can reach it.

## Version coupling

`playwright` is pinned exactly to the line whose bundled Chromium matches the
pre-installed build; a caret would drift to a build the session cannot
download. Bump both together, or set `DP_CHROME_PATH`.
