---
slug: cash-or-miles-emirates-three-quotes
tier: T3
vertical: travel-experiences
assigned-editor: travel-experiences-editor
research-status: complete
seo-status: passed
draft-status: complete
factcheck-status: passed
ux-status: pass-with-edits
standards-status: passed
tech-status: passed
chairman-status: approved
target-publish: 2026-11-05
sources-required: 2
---

# Cash or Miles? Compare three Emirates prices, not two

## The reader question

Is the Cash+Miles reduction offered at checkout better than a separate Classic Reward, or should I pay entirely in cash? Give the reader a repeatable comparison without pretending to have captured a fare.

## Why now

The owner approved expansion of the original Cash or Miles series in the [accuracy and evidence sprint](2026-11-05-accuracy-evidence-growth-sprint.md). The first edition compared hypothetical cash and reward tickets; the second captured a specific Etihad quotation. This edition adds a distinct third option and a reusable shopping sequence rather than another unverified route price.

## Out of scope

No live fare, available reward seat, booking, flight experience, promotional conversion rate, purchased miles, new valuation or transfer promise. No new financial model or paid source retrieval. The example inputs are explicitly invented for teaching, not airline data. No homepage or design-system change, new media download, generation or purchase. Bounded reuse of an existing licensed aircraft photograph was added during QA, with full provenance and a visible non-trip limitation.

## Done when

- Distinguish Cash+Miles from Classic Rewards using Emirates' own current pages.
- Label every scenario input hypothetical and derive every output with the existing Cash or Miles calculator and Skywards editorial baseline.
- Compare the same hypothetical itinerary, party, baggage and fare conditions; tell readers when real quotations fail that test.
- Explain that payment due and value per mile answer different questions; do not name a universal winner.
- Independently review the facts, arithmetic, links, rendering and Council gate before publication.

## SEO spec for review

- Primary query: Emirates Cash+Miles vs Classic Rewards.
- Variants: Skywards Cash+Miles value; Emirates miles or cash; compare Emirates reward ticket; Skywards redemption calculator.
- Intent: informational decision support, not an application or booking landing page.
- Proposed description: Cash+Miles and Classic Rewards are different ways to use Skywards Miles. A clearly hypothetical example shows how to compare both with a cash fare.
- Structure: what the two options mean → explicitly hypothetical three-price example → repeatable quotation checklist → existing calculator action.
- Word-count band: approximately 450–650 words, excluding metadata/code.
- Internal links: `/calculator/cash-or-miles/`, `/valuations/methodology/`, `/airlines/skywards/` and the original two-example edition.
- Schema and images: existing NewsArticle; `textLed: true` retains the compact text-first heading while an inline, credited existing Emirates-livery photograph supports the article. No invented review score, author, priced/booked trip or photograph. The listing now resolves an article-specific stock key.
- Discovery note: free web queries on 2026-11-05 surfaced Emirates' FAQ and Cash+Miles page for the comparison intent. This is bounded discovery, not an exhaustive or geo-controlled top-ten SERP/volume/ranking study. SEO approval remains pending for the root reviewer.

## Research hand-off

Head of Research completed the [dossier](../research/2026-11/cash-or-miles-emirates-three-quotes-dossier.md) before the Section Editor draft. No Firecrawl credits or media costs incurred. Section Editor acknowledged the bounded teaching-example scope on 2026-11-05. Independent specialist review and publication are not established by this brief.

Draft prepared 2026-11-05. `npm run check` passed with no errors/warnings (four existing hints). The new three-price arithmetic test and existing related source/timeline tests passed: 11 focused tests total. These checks do not establish rendered-page quality, independent fact-check, SEO approval, Council sign-off or deployment; root owns those remaining gates.

Later review, 2026-11-05: independent facts/Standards/on-page SEO and built
phone/desktop light/dark review passed. Existing NewsArticle/breadcrumbs,
canonical, links, sitemap and Pagefind verified. Source-credited imagery
uses responsive delivery with explicit non-trip limits. Local technical
review passed; exact-head Linux, preview/production and normal merge remain
external release gates. Chairman in-session “Ok do it all” approves this
scoped source-cleared follow-up, not tracking or commercial activation.

Image-coverage follow-up, 2026-11-05: reused the licensed `programme-skywards` photograph without downloading or changing pixels. Full original source, photographer, licence, dimensions and capture date are retained under the new stock key and in [the reuse register](../../data/stock/LIBRARY.md). Visible figure caption explicitly disclaims the fictional flight, fare availability and personal journey; photographer credit is rendered beside it. No missing-image test exception added. Built visual/credit QA remains pending.
