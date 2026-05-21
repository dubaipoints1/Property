# Card-review image library

Editorial photographs surfaced by `<HeroImage />` (above the body
grid) and `<SectionBreak />` (inside the prose) on
`/cards/<slug>/` pages. The directory is the single source of truth
for filenames; the MDX frontmatter `heroImage.src` and the
SectionBreak `image="…"` prop both resolve here at build time via
`import.meta.glob`.

## Policy

- **No AI-generated photography.** Period. The kill-list entry in
  `.council/01_editorial_standards.md` §10 is load-bearing.
- **Every entry below carries a verifiable license.** Source URL,
  license type, and clearance date are recorded per-image in the
  table below.
- **No issuer / airline marketing creative without written
  permission.** Permission email reference goes in the table's
  Notes column.
- **Every published image carries a visible credit line.** The
  `<HeroImage />` and `<SectionBreak />` components render
  `caption · credit` under the photograph; the `credit` field on
  the MDX frontmatter is the source of truth.
- License changes, takedowns, and refreshes log here. The Standards
  Editor owns this file.

## Status of this commit

All 12 entries below currently render **placeholder JPGs** generated
by `scripts/gen-placeholder-library.mjs` (1600×900 solid-colour
plates with the filename overlaid). Real images replace them per the
status table — CLEAR rows take Unsplash CC0 fallbacks; PENDING rows
wait on issuer permission. The placeholders are real binaries so the
Astro `<Image>` optimiser produces the responsive set at build time;
swapping a placeholder for the licensed image is a same-filename
file-overwrite + a row update in the table below.

Initial commit ships generated placeholders; real images land per
the LICENSE-CLEARANCE-STATUS table on each subsequent propagation
pass.

## LICENSE-CLEARANCE-STATUS

| Filename | Status | License intent | Source / fallback | Cleared on | Notes |
|---|---|---|---|---|---|
| `emirates-a380-dxb.jpg` | PROVISIONAL (placeholder) | Emirates Media Kit (preferred) / Unsplash CC0 (fallback) | Pending Emirates permissions email | — | Hero — Skywards Infinite |
| `emirates-cabin-business.jpg` | PROVISIONAL (placeholder) | Emirates Media Kit (preferred) / Unsplash CC0 (fallback) | Pending Emirates permissions email | — | Section-break — Skywards Infinite |
| `etihad-787-cabin.jpg` | PROVISIONAL (placeholder) | Etihad Media Bank (preferred) / Unsplash CC0 (fallback) | Pending Etihad permissions email | — | Reserved for Etihad Guest cards |
| `flydubai-boeing-738.jpg` | PROVISIONAL (placeholder) | flydubai Media Centre (preferred) / Unsplash CC0 (fallback) | Pending flydubai permissions email | — | Reserved for flydubai co-brands |
| `marriott-hotel-exterior.jpg` | PROVISIONAL (placeholder) | Marriott Newsroom / Unsplash CC0 (fallback) | Pending Marriott permissions email | — | Reserved for hotel co-brands |
| `dxb-airport-concourse.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 / Mike Kononov | unsplash.com (planned) | — | Hero — Skywards Signature |
| `dubai-skyline-burj.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 / David Rodrigo | unsplash.com (planned) | — | Section-break — Skywards Signature |
| `dubai-fine-dining.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | — | Reserved for dining-focus cards |
| `dubai-mall-evening.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | — | Reserved for retail co-brands |
| `aed-banknotes-flat.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | — | Reserved for cashback cards |
| `yas-island-aerial.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | — | Reserved for Etihad / Abu Dhabi cards |
| `lulu-store-interior.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | — | Reserved for LuLu / grocery co-brands |

## Workflow for adding an image

1. Standards Editor confirms the planned use + license intent.
2. Drop the file at `src/assets/cards/library/<filename>` (lowercase
   ASCII, hyphens, jpg/jpeg/png/webp/avif).
3. Add a row to the table above with status, license, source URL,
   and clearance date. Commit the file + this table together.
4. Reference the filename in MDX frontmatter (`heroImage.src`) or a
   `<SectionBreak image="…" />` prop. The Zod schema enforces the
   filename shape; the components throw at build time if the file
   is missing.
5. Re-run `npm run check` and `npm run build` to confirm Astro's
   image optimiser picks up the new file.

## Workflow for replacing a placeholder

1. Save the licensed binary over the existing filename. Do not
   rename — the MDX call sites already reference it.
2. Flip the row's status from `PROVISIONAL (placeholder)` to
   `CLEAR` and fill in the cleared-on date.
3. Update `credit` in the MDX frontmatter (or `<SectionBreak />`
   prop) to the final credit string.
4. Commit both the binary swap and the table update in the same
   commit; the commit message references the row that changed.
