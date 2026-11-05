---
slug: uae-card-change-log-liv-eligibility-vat-correction
tier: T3
vertical: business-realestate
assigned-editor: business-realestate-editor
research-status: complete
seo-status: passed
draft-status: complete
factcheck-status: passed
ux-status: pass-with-edits
standards-status: passed
tech-status: passed
chairman-status: approved
target-publish: 2026-11-05
sources-required: 3
---

# UAE Card Change Log: correcting our Liv salary and fee figures

## The reader question

What did DubaiPoints correct about Liv Cashback eligibility and Cashback+ fees, and does that change which card a reader should shortlist?

## Why now

The accuracy sprint found that our listings treated absent salary data as no salary minimum and displayed a pre-VAT Cashback+ fee as VAT-inclusive. The bank's current KFS provides the corrective evidence. This is a transparent correction to our publication, not a report that Liv has just changed its rules or prices.

## Out of scope

No dated issuer-change claim, automatic approval prediction, new earnings/waiver assumption, re-verification of every Liv benefit or application/affiliate CTA. No fresh typed financial value extracted by an LLM. Do not duplicate the eligibility agent's cards.json, review, guide, correction-log or parser edits.

## Done when

- Use the inspected KFS named-column parser and source metadata supplied by the separate accuracy workstream for all corrected financial values.
- Describe both salary and VAT corrections without blaming the bank or hiding the old publication error.
- Keep the product page's joining-fee waiver distinct from the recurring fee.
- Link the relevant reviews and Card Finder, noting that a minimum is not approval.
- Obtain independent article-level review and normal release gates before publication.

## SEO spec for review

- Primary query: Liv Cashback credit card minimum salary.
- Variants: Liv Cashback Plus eligibility; Liv Cashback Plus annual fee VAT; Liv Cashback salary requirement; Liv credit card joining fee.
- Intent: informational correction linked to the existing canonical product reviews, not a competing broad review.
- Proposed description: We corrected our Liv salary eligibility and Cashback+ fee figures against the issuer's key facts. This is a DubaiPoints correction, not a new bank change.
- Structure: own the correction → concise corrected facts → VAT/waiver distinction → reader's next action and verification limit.
- Approximately 350–500 words; existing text-led NewsArticle heading/typography with an inline existing issuer-supplied Liv card image and visible credit; no new generated/downloaded imagery, scores or authors.
- Internal links: both Liv card reviews, `/cards/finder/` and `/corrections/` (source routes confirmed; built-page link check still required).
- Free discovery surfaced the issuer feature/product pages and the prior DubaiPoints no-minimum snippet. That is not a complete top-ten/geo-controlled SERP, traffic signal or ranking study. SEO approval remains pending.

## Research hand-off

Head of Research reviewed the [dossier](../research/2026-11/uae-card-change-log-liv-eligibility-vat-correction-dossier.md) and the accuracy workstream's source/parser record before drafting. Section Editor acknowledged on 2026-11-05. No paid retrieval, new asset, publication or article-level fact-check sign-off occurred in this workstream.

Root approved the build-only curated-fixture/parser method for a frozen historical snapshot on 2026-11-05. Draft prepared with that method. `npm run check` passed with no errors/warnings (four existing hints); 11 focused source/parser/timeline/editorial tests passed. Actual build must still confirm the table renders and that the source fixture/parser is absent from client assets. Article-level independent facts/SEO/standards review, visual QA, Council sign-off and deployment remain root-owned gates.

Later review, 2026-11-05: independent PDF/parser/claims, Standards and SEO
review passed. Built frozen cells, canonical/JSON-LD/links/sitemap/search,
source/client exclusion and light/dark visuals verified. Clipped portrait
art was corrected and complete image/credit independently rechecked. Local
technical review passed; required exact-head Linux/preview/production and
normal-merge gates remain external. Chairman direction “Ok do it all”
approves the scoped publishing correction, not a bank-change claim.

Image-coverage follow-up, 2026-11-05: root approved a byte-identical stock-compatible alias of the already-published, issuer-supplied Liv Cashback+ art. No download, image editing, AI or schema expansion. Its exact Liv image/product URLs, original 2026-10-09 sourcing date, dimensions, Charter editorial-use basis, credit and SHA-256 are in [the reuse register](../../data/stock/LIBRARY.md) and stock entry. The article uses the established `CardImage` presentation with a visible Liv credit and makes clear that card art is identification, not evidence of salary or fee terms. The listing resolves the new stock key. No missing-image exception added; built visual/credit QA remains pending.
