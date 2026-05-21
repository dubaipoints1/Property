---
slug: phase-2a-2-4-visual-rhythm
vertical: business-realestate
assigned-editor: standards-editor
predecessor-brief: phase-2a-2-3-editor-scorecard-and-vat
gate-cleared: phase-1-chairman-approval (2026-05-20)
parent-programme: phase-2a-uae-banks-expansion
research-status: in-progress (UX spec + Standards image-policy draft dispatched 2026-05-20)
seo-status: hero-image alt text adds reader-facing copy; methodology unchanged
draft-status: pending (image-library seed pending Standards Editor sourcing)
tech-status: pending (queued behind UX spec)
factcheck-status: pending (each image's source + license verified by Standards Editor)
standards-status: in-progress
chairman-status: pending
target-publish: 2026-05-25
tier: T2
type: visual-rhythm + photography
---

# Phase 2a.2.4 — Visual rhythm + photography

> Lands BEFORE the `phase-2a-2.1` propagation so all 30 card-review MDX
> files inherit the new template — with hero images, more breathing
> room, and one section-break image — in one pass instead of two.

## The reader problem

Operator reviewed the rebuilt Skywards Infinite reference on 2026-05-20 (post Phase 2a.2.3 — kicker + AtAGlance + scorecard + VAT clarity) and reported the page **still feels dense** on mobile. Specifically:

1. **No images anywhere.** A reader scrolling through Skywards Infinite sees a column of text-blocks (lead → AtAGlance → verdict → pros/cons → earn rates → fee summary → welcome → conditions → comparison → scorecard → caveats). The visual register is "spreadsheet" not "publication." Every comparable publication (TPG, NerdWallet, FT Money, HfP) uses hero photography + section-break imagery to give the reader visual rests.
2. **Word density between components is high.** The components themselves are dense by design — at-a-glance numbers, structured tables, callout boxes. The transitions between them are the issue: 16–24px of margin doesn't feel like "next chapter," it feels like "next paragraph of the same wall."

The operator pointed at TPG (thepointsguy.com) as the reference: "clean texts font wise, spaces images." Their pattern: hero photo → lead → spec block → photo → next section → photo → comparison → footer photo.

The fix is two-fold: (a) more vertical breathing room in the article layout, (b) controlled photography in three slots — hero (top), section-break (between Welcome bonus breakdown and Key conditions to know), and a tail image (optional, before the EditorScorecard).

## The four-part fix

### Part A — `.dp-article` breathing-room pass (CSS-only)

`src/styles/global.css` — increase vertical margins in the `.dp-article` long-form layout:

- Between major component blocks (`<AtAGlance />`, `<EditorVerdict />`, `<ProsCons />`, `<EarnRateTable />`, `<FeeBlock />`, etc.): 24px → **40px** on desktop, 20px → **32px** on mobile.
- `.dp-article h2` top margin: 32px → **48px** desktop, 24px → **36px** mobile (so each section reads as a chapter break).
- `.dp-article h2` margin-bottom (between heading and the component below it): 12px → 16px.
- `.dp-conditions` block top margin: +12px (currently 16px → 28px).

Single-commit CSS change. No schema changes, no new components, no MDX edits. Visual lift is immediate.

### Part B — Hero image at the top of every card-review page

Wire `Cover.astro` (already exists at `src/components/Cover.astro`) into the card-review layout OR call from MDX. Standards-Editor/Tech-Lead decide which surface owns placement — recommend layout-side so it's automatic on every card-review page without 30 MDX edits.

Schema addition on card frontmatter (`src/content.config.ts`):

```typescript
heroImage: z.object({
  src: z.string(),         // filename in src/assets/cards/library/
  alt: z.string().max(140),
  caption: z.string().max(120).optional(),
  credit: z.string().max(80).optional(),
}).optional(),
```

Render position: **below** the page-title dark-navy hero block, **above** the byline + lead paragraph. Full content-width (capped at the article column width), 16:9 aspect ratio. Caption + credit in 11px / `--ink-soft` immediately under the image, separated by a `·`.

When `heroImage` is absent (most cards, until propagation runs), no image renders — the layout falls back to the current text-only header.

### Part C — One section-break image mid-article

New tiny component: `src/components/cards/SectionBreak.astro`.

Renders a single image, full content-width, **8:3 aspect ratio** (wider than the hero — explicitly a transitional reset, not a hero). Caption + credit in 11px below.

MDX call:

```mdx
<SectionBreak image="emirates-cabin-business.jpg" caption="Emirates Business Class cabin." credit="Emirates Media Kit / 2024" />
```

The section editor places it between **`## Welcome bonus breakdown`** and **`## Key conditions to know`** on every card-review page (one image per card, mid-article). Optional second placement before the EditorScorecard if the editor wants a tail rest.

Mobile: 8:3 aspect ratio holds; full width; caption + credit drop to 10px on `<720px`.

### Part D — Image library + license policy

New directory: `src/assets/cards/library/`. Twelve seed images, mapped to card taxonomy:

| Taxonomy slot | Image | Source / licence |
|---|---|---|
| Skywards / Emirates co-brand | `emirates-a380-dxb.jpg` | Emirates Media Kit — pending licence confirmation |
| Skywards / Emirates co-brand | `emirates-cabin-business.jpg` | Emirates Media Kit — pending |
| Etihad co-brand | `etihad-787-cabin.jpg` | Etihad Press / Wikipedia (CC BY-SA) |
| flydubai co-brand | `flydubai-boeing-738.jpg` | flydubai Press |
| Marriott Bonvoy co-brand | `marriott-hotel-exterior.jpg` | Marriott Press / Unsplash CC0 |
| Travel — generic | `dxb-airport-concourse.jpg` | Unsplash CC0 — Mike Kononov |
| Travel — generic | `dubai-skyline-burj.jpg` | Unsplash CC0 — David Rodrigo |
| Dining — Dubai | `dubai-fine-dining.jpg` | Unsplash CC0 — Brooke Lark |
| Lifestyle — Dubai | `dubai-mall-evening.jpg` | Unsplash CC0 — Lucas Pezeta |
| Cashback — generic | `aed-banknotes-flat.jpg` | Unsplash CC0 — Eric Prouzet |
| Aldar / Darna | `yas-island-aerial.jpg` | Aldar Press — pending |
| LuLu / supermarket | `lulu-store-interior.jpg` | LuLu Press — pending |

Plus a one-line license note per image in `src/assets/cards/library/LIBRARY.md`. Standards Editor confirms each license before publication; images with `pending` license use placeholder copy on the rendered page.

**Charter compliance**: no random Google searches; no AI-generated photography; no bank-supplied marketing creative used without explicit written permission. The site's "evidence-led" voice extends to image provenance — every image carries a credit line.

### Per-card frontmatter pre-fills for the two Skywards references

**Skywards Infinite**:

```yaml
heroImage:
  src: emirates-a380-dxb.jpg
  alt: Emirates A380 on the apron at DXB
  caption: Emirates' A380 — the flagship aircraft for the long-haul redemptions this card pays back on.
  credit: Emirates Media Kit / 2024
```

Section-break image (in MDX body, between Welcome bonus and Key conditions):

```mdx
<SectionBreak image="emirates-cabin-business.jpg" caption="Emirates Business Class — the redemption target the 100,000-mile welcome bonus reaches with room to spare." credit="Emirates Media Kit / 2024" />
```

**Skywards Signature**:

```yaml
heroImage:
  src: dxb-airport-concourse.jpg
  alt: Dubai International Airport, Concourse B departures
  caption: DXB Concourse B — the access point the Signature's Visa Airport Companion lounge benefit opens.
  credit: Unsplash CC0 / Mike Kononov
```

Section-break image:

```mdx
<SectionBreak image="dubai-skyline-burj.jpg" caption="Dubai from above — the city the Signature is built for, at the AED 12,000 salary band that excludes the Infinite." credit="Unsplash CC0 / David Rodrigo" />
```

## Done when

1. `.dp-article` breathing-room CSS changes land in `global.css`.
2. `Cover.astro` wired to render `heroImage` on every card-review page (layout-side, not MDX-side).
3. New `<SectionBreak />` component shipped at `src/components/cards/SectionBreak.astro`.
4. Twelve seed images live in `src/assets/cards/library/` with a `LIBRARY.md` carrying source + license per image.
5. `heroImage` schema added to the cards content collection.
6. Skywards Infinite + Signature MDX both carry `heroImage` frontmatter and a `<SectionBreak />` call in body.
7. `npm run check` / `npm run build` / `npm test` all green; new tests for SectionBreak render + heroImage schema validation.
8. Lighthouse Performance score on `/cards/emirates-nbd-skywards-infinite/` within 3 points of the Phase 2a.2.3 baseline (image-heavy pages risk a Performance regression — Tech Lead optimises via Astro's Image component + `loading="lazy"` on the section-break).
9. Council sign-off: Standards Editor (image library + license clearance), UX (breathing-room CSS + image sizing), Tech Lead (component + schema), Chairman (the photography programme + license policy).

## Out of scope

- The other 28 card-review MDX files — `phase-2a-2.1` propagation brief carries them with the new template. Section editor pre-fills `heroImage` + drops a `<SectionBreak />` during propagation, choosing from the seed library.
- Commissioned photography — Phase 3 if the library proves itself; for now licensed editorial stock + bank press kits.
- Logo placement (BankLogo / ProgrammeLogo are already wired in SpecCard / CardComparison) — no changes.
- Video embeds — Phase 3 at earliest.

## Acceptance for the Chairman gate

The Chairman will refuse if:

- Any image renders without a verifiable license (every entry in `LIBRARY.md` must trace to a source + license string).
- An AI-generated image is in the library.
- A bank's marketing creative is used without written permission referenced in `LIBRARY.md`.
- Lighthouse Performance score drops more than 3 points vs. the Phase 2a.2.3 baseline.
- Any image renders without a credit line.
- Mobile (375px) shows horizontal scroll on the hero or section-break.

---

_Brief opens 2026-05-20 on operator feedback. Head of UX dispatched at brief-open to spec the breathing-room CSS deltas + SectionBreak component sizing + Cover.astro wiring on the card-review layout. Standards Editor dispatched at brief-open to source the 12 seed images, write `LIBRARY.md`, and confirm licenses. Tech Lead queues behind both. Target Chairman gate: 2026-05-25._
