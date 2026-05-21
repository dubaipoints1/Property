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
- **Issuer / airline press libraries are usable under standard
  editorial-publication interpretation.** Per the 2026-05-21
  Charter amendment, a public press / media library on the issuer's
  own website (e.g. `emirates.com/media-centre/media-library/`,
  Etihad / Qatar / Saudia / flydubai press centres, bank press
  kits) constitutes the licence — the library's existence on the
  issuer's public site is the permission. Each rendered page must
  carry a visible credit line ("Image courtesy of Emirates Media
  Centre" or the equivalent). Where an issuer publishes terms-of-
  use that explicitly restrict editorial use, those terms override.
  Takedown requests are honoured within 24 hours.
- **Every published image carries a visible credit line.** The
  `<HeroImage />` and `<SectionBreak />` components render
  `caption · credit` under the photograph; the `credit` field on
  the MDX frontmatter is the source of truth.
- **Source URL + credit-line string + date-sourced live in this
  file.** Not in JSDoc, not in frontmatter, not in commit messages.
- License changes, takedowns, and refreshes log here. The Standards
  Editor owns this file.

## Status of this commit

All 12 entries below currently render **placeholder JPGs** generated
by `scripts/gen-placeholder-library.mjs` (1600×900 solid-colour
plates with the filename overlaid). Real images replace them per the
status table — issuer-press-kit rows take the linked source URL per
the 2026-05-21 amendment; non-issuer rows take Unsplash CC0
fallbacks. The placeholders are real binaries so the Astro `<Image>`
optimiser produces the responsive set at build time; swapping a
placeholder for the sourced image is a same-filename file-overwrite +
a row update in the table below (no Status change needed if the row
is already CLEAR — the policy clearance precedes the binary swap).

The CLEAR rows below are licensed under the amendment; their
placeholder binaries are pending a swap, not a permission email.

## LICENSE-CLEARANCE-STATUS

| Filename | Status | License | Source URL | Credit line | Date sourced | Notes |
|---|---|---|---|---|---|---|
| `emirates-a380-dxb.jpg` | CLEAR (binary pending) | Emirates Media Centre — editorial-publication interpretation | https://www.emirates.com/media-centre/media-library/ | Image courtesy of Emirates Media Centre | 2026-05-21 | Hero — Skywards Infinite |
| `emirates-cabin-business.jpg` | CLEAR (binary pending) | Emirates Media Centre — editorial-publication interpretation | https://www.emirates.com/media-centre/media-library/ | Image courtesy of Emirates Media Centre | 2026-05-21 | Section-break — Skywards Infinite |
| `etihad-787-cabin.jpg` | CLEAR (binary pending) | Etihad Media Bank — editorial-publication interpretation | https://www.etihad.com/en-ae/about-us/etihad-news/media-bank | Image courtesy of Etihad Media Bank | 2026-05-21 | Reserved for Etihad Guest cards |
| `flydubai-boeing-738.jpg` | CLEAR (binary pending) | flydubai Media Centre — editorial-publication interpretation | https://media.flydubai.com/ | Image courtesy of flydubai Media Centre | 2026-05-21 | Reserved for flydubai co-brands |
| `marriott-hotel-exterior.jpg` | CLEAR (binary pending) | Marriott Newsroom — editorial-publication interpretation | https://news.marriott.com/photos | Image courtesy of Marriott Newsroom | 2026-05-21 | Reserved for hotel co-brands |
| `dxb-airport-concourse.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 / Mike Kononov | unsplash.com (planned) | Unsplash CC0 / Mike Kononov | — | Hero — Skywards Signature |
| `dubai-skyline-burj.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 / David Rodrigo | unsplash.com (planned) | Unsplash CC0 / David Rodrigo | — | Section-break — Skywards Signature |
| `dubai-fine-dining.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | Unsplash CC0 | — | Reserved for dining-focus cards |
| `dubai-mall-evening.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | Unsplash CC0 | — | Reserved for retail co-brands |
| `aed-banknotes-flat.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | Unsplash CC0 | — | Reserved for cashback cards |
| `yas-island-aerial.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | Unsplash CC0 | — | Reserved for Etihad / Abu Dhabi cards |
| `lulu-store-interior.jpg` | PROVISIONAL (placeholder) — CLEAR target | Unsplash CC0 | unsplash.com (planned) | Unsplash CC0 | — | Reserved for LuLu / grocery co-brands |

## Workflow for adding an image

1. Standards Editor confirms the planned use + license source.
2. Drop the file at `src/assets/cards/library/<filename>` (lowercase
   ASCII, hyphens, jpg/jpeg/png/webp/avif).
3. Add a row to the table above with status, license, source URL,
   credit line, and date sourced. Commit the file + this table
   together.
4. Reference the filename in MDX frontmatter (`heroImage.src`) or a
   `<SectionBreak image="…" />` prop. The Zod schema enforces the
   filename shape; the components throw at build time if the file
   is missing.
5. Re-run `npm run check` and `npm run build` to confirm Astro's
   image optimiser picks up the new file.

## Workflow for swapping a placeholder binary

For CLEAR rows where the licence already exists per the amendment
but the binary is still a placeholder:

1. Save the sourced binary over the existing filename. Do not
   rename — the MDX call sites already reference it.
2. Keep the row at CLEAR; update the date-sourced if the binary
   was refreshed.
3. The `credit` field in the MDX frontmatter (or `<SectionBreak />`
   prop) already carries the final credit string — no MDX change
   required if the row was already CLEAR.
4. Commit the binary swap; the commit message references the row
   that changed.

## Takedown procedure

If an issuer requests removal of a specific image:

1. Replace the binary with a placeholder of the same filename (or
   swap to an Unsplash CC0 alternative if available).
2. Flip the row's Status to `TAKEN DOWN` and append the takedown
   date to the Notes column.
3. Update the MDX `credit` field if a fallback source is in use.
4. The 24-hour turnaround is non-negotiable. Standards Editor
   escalates to Chairman if the swap cannot be completed in time.
