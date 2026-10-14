---
slug: newsletter-removed
tier: T2
owner: technical-lead
section: site-chrome
opened: 2026-10-14
status: shipped
chairman-status: approved
chairman-direction: "i dont want to add a newsletter yet tbh, so scrap that for now completelty." — Chairman in-session, 14 October 2026
---

# Newsletter removed: no Friday brief, no launch list, no sign-up

## Decision

The site carries no newsletter. Every reader-facing trace of the Friday
brief, its launch list and the Buttondown sign-up is gone. This supersedes
the 10 September 2026 R3 ruling, which had demoted the CTA while keeping
the page, the form and an environment switch (`PUBLIC_BUTTONDOWN_USERNAME`)
that would have restored it. There is no switch now: bringing a newsletter
back is a new brief.

## What shipped

- **Deleted.** `src/pages/newsletter.astro`,
  `src/components/NewsletterSignup.astro`, `src/lib/newsletter.ts`, the
  `.dp-aside-newsletter` rules in `global.css` and the per-page
  `.intel-insider` styles; `PUBLIC_BUTTONDOWN_USERNAME` removed from
  `.env.example`.
- **Header.** No brief row in the mobile overlay and no subscribe pill.
- **Homepage close band.** The "Friday brief" sign-up is replaced by a
  "Keep up" block: "New offers land on the news desk first." with three
  rows to Latest news (`/news/`), Live deals (`/deals/`) and the RSS feed.
  The stats and trust links above it are unchanged.
- **Asides.** The green "The brief" box is removed from ArticleLayout,
  NewsIndexLayout and the deals, guides, airlines and banks indexes. Where
  the rail could otherwise be empty, the `<aside>` now renders only when
  it has content.
- **Empty states.** Deals: the copy points to the news desk and RSS feed,
  with "Read the news" plus "RSS feed" buttons. News index: "RSS feed" plus
  "Browse the guides". Desk indexes (airlines, hotels, banking): "All news"
  plus "RSS feed".
- **Trust pages.** How we make money now lists two eventual revenue sources,
  not three, and drops the Buttondown sentence; the Partnership page loses
  its Newsletter section; the style-guide kill-list example no longer
  mentions the brief.
- **Redirects.** `/newsletter` and `/newsletter/` 301 to `/`; the old
  `/friday-brief` aliases now go to `/` as well, not to a dead page.
- **CSP.** `form-action` is `'self'` only; Buttondown is no longer an
  allowed third party (`scripts/build/csp-hashes.mjs`).
- **Tests.** The redirect fixtures no longer target `/newsletter/`; a new
  test asserts the real `public/_redirects` sends every newsletter URL to
  `/`, and another asserts `form-action 'self'` with no Buttondown.

RSS (`/rss.xml`) stays.

## Not changed

CLAUDE.md is not edited. Its R3 amendment text records the history; this
brief records that the newsletter has since been removed.
