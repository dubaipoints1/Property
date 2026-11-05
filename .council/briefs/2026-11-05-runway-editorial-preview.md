---
slug: runway-editorial-preview
vertical: travel-experiences
assigned-editor: travel-experiences-editor
draft-status: prepared
factcheck-status: pending
tech-status: pending
chairman-status: pending
---

# Runway Editorial — layout, not less copy

T3 private review. The owner asked to research the visual hierarchy and
palette and preview the proposed layouts. This is not a rollout or a
homepage replacement. No production or dependency changes are authorised.

## Evidence and its limits

- [NN/g’s eye-tracking analysis](https://www.nngroup.com/articles/layer-cake-pattern-scanning/) describes readers using distinct headings and grouped content to locate a relevant section. Implication: make the existing hierarchy visible with typography and spacing, not wholesale copy cuts.
- [GOV.UK’s layout guidance](https://design-system.service.gov.uk/styles/layout/) recommends starting in one column and constraining the desktop reading measure. This is a starting point for editorial copy, not a constraint on a data grid or universal line-length claim.
- [Baymard’s comparison research examples](https://baymard.com/ecommerce-design-examples/39-comparison-tool) identify inconsistent specifications and formatting as barriers to comparison. Implication: align existing salary, fees and reward data rather than requiring the reader to match unrelated card heights.
- [W3C’s carousel guidance](https://www.w3.org/WAI/tutorials/carousels/) emphasises user control and keyboard navigation. Keep the programme rail manually controlled; keep the layout useful without script.
- [The Points Guy’s card hub](https://thepointsguy.com/credit-cards/) separates discovery by card type, editorial stories and a matching tool. The observed structure is a reference, not evidence of its conversion or of the best ordering for UAE readers. No affiliate placement, text or imagery copied.

## Directions tested on identical Deals content

| Direction | Palette | Composition and use |
|---|---|---|
| Runway Editorial | Cool porcelain, deep ink and restrained petrol; midnight in dark mode | One split lead feature then a grid. Balance visual identity and the ability to see an offer’s terms in the same scan. |
| Linen Journal | Warm paper and muted plum | Centred opening and an image-first lead with copy beneath it. Useful for a feature-led publication; it pushes offer details down. |
| Blue Ledger | Cool grey and slate-blue | More compact header and offer-first list rows. Efficient for repeated comparison, less immersive for browsing. |

Recommendation for owner review: Runway as the shared direction, Ledger’s
discipline for tools, and the larger image treatment only on editorial
journeys. These are hypotheses, not measured effects on traffic or sales.

## Implementation and acceptance boundary

- `/cards/compare/`, `/deals/` and `/airlines/` are gated by `DP_RUNWAY_PREVIEW=1`. No eligibility data, fees, formulas, offer copy or asset licences change. Existing navigation and URLs remain.
- [Coss Button](https://21st.dev/@coss.com/components/coss-button/variants), [Kokonut Carousel Cards](https://21st.dev/@kokonutd/components/carousel-cards) and [Editorial Collage Hero](https://21st.dev/@felipemenezes098/components/hero-04) are public design references, rebuilt in the existing stack. No provider calls, downloads, purchases, generation or third-party runtime dependencies.
- `DP_RUNWAY_HOME_PREVIEW=1` emits a separate noindex concept for a below-reel feature, outside the sitemap. It does not change `/` or the reel.
- Review rendered before/after in both modes and at phone/desktop sizes; verify intermediate sizes, keys, filters, resize state and the ordinary build’s exclusions. Only an explicit Chairman decision can move this beyond preview.
