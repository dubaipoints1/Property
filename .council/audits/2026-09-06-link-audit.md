---
title: Site-wide menu / link audit (agenda A1)
date: 2026-09-06
filed: 2026-09-07
owners: head-of-ux, seo-strategist, managing-editor (joint, per agenda-next.md A1)
rated-by: audit session (orchestrator) against the Head of UX kill-list rule 4 and the 2026-07-27 honest-nav rule — A1 owners sign off at review
source: .council/research/2026-09/site-audit-2026-09-06-evidence/chrome-inventory.json (extracted from the built homepage, commit b242105)
master-report: .council/research/2026-09/site-audit-uiux-2026-09-06.md
status: A1 delivered
---

# Site-wide menu / link audit — 2026-09-06

Every link in the site chrome — header, both mega-menus, actions, quick-link strip, mobile overlay, five footer columns, footer brand bar — plus every link on the homepage: **232 rows across 14 surfaces**. Ratings follow the A1 brief: **Clarity** (1–5: does the label say where it goes?), **Content** (live / thin / empty / redirect — from the built page: words in `<main>`, child links, placeholder copy), **Purpose** (what reader job the link does) and a recommendation. Finding ids (F-xxx) refer to the master report.

Method note: the inventory was extracted from `dist/index.html` with Playwright (`chrome-inventory.mjs`, kept with the evidence); "live" means ≥ 250 words or ≥ 4 child links in the destination's `<main>`, "thin" means neither. The Chairman's brief was "Go through link by link and understand the content. Does it make sense for what is the menu? What is it achieving?" — the Purpose column answers the third question.


## Header — desktop primary nav

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | Wordmark (DubaiPoints) |  | `/` | 5 | live | Home — universal convention | Keep |
|  | Credit cards ▾ |  | `/cards/` | 4 | live | Top-level section; panel trigger | Keep |
|  | Banks |  | `/banks/` | 5 | live | Issuer hub directory | Keep |
|  | Earn miles ▾ |  | `/airlines/` | 3 | live | Panel trigger for bank, airline AND hotel programmes — "Earn miles" undersells two of the three groups | Relabel "Points & miles" (matches the mobile overlay row) |
|  | Guides |  | `/guides/` | 5 | live | Long-form directory | Keep |
|  | Deals |  | `/deals/` | 4 | thin | Primary nav slot for a three-item desk | Decision F-047: grow the desk or fold the slot |
|  | News |  | `/news/` | 5 | live | News desk | Keep |

## Header — mega-menu 1 (Credit cards ▾)

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
| By card type | Best overall UAE cards | Editor's pick | `/cards/` | 4 | live | Job: pick a card — lands on the directory whose first band is "Top picks this month" | Keep |
| By card type | Best travel cards | Miles & lounge access | `/cards/miles/` | 5 | live | Job: miles card shortlist | Keep |
| By card type | Best cashback cards | Capped & uncapped | `/cards/cashback/` | 5 | live | Job: cashback shortlist | Keep |
| By card type | Best Islamic (Sharia) cards |  | `/cards/islamic/` | 5 | thin | Job: Sharia-compliant shortlist (9 cards) | Keep |
| By card type | Cards by your salary | AED 5k to 30k+ | `/cards/salary/` | 5 | live | Job: eligibility-first browse | Keep |
| By card type | Card finder | Match a card to your spend | `/cards/finder/` | 4 | live | Tool | Keep |
| By card type | All cards |  | `/cards/` | 5 | live | Site column | Keep |
| By bank issuer | FAB cards |  | `/banks/fab/` | 3 | live | Label says cards; destination is the bank hub (which lists them below the fold) | Keep; consider "FAB" to match the hub h1 |
| By bank issuer | Emirates NBD cards |  | `/banks/emirates-nbd/` | 3 | live | As above | Keep |
| By bank issuer | ADCB cards |  | `/banks/adcb/` | 3 | live | As above | Keep |
| By bank issuer | RAKBANK cards |  | `/banks/rakbank/` | 3 | live | As above | Keep |
| By bank issuer | Emirates Islamic cards | Islamic | `/banks/emirates-islamic/` | 3 | live | As above | Keep |
| By bank issuer | All issuers |  | `/banks/` | 4 | live | Directory exit | Keep |
| Co-branded cards | Emirates Skywards cards |  | `/airlines/skywards/` | 3 | live | Label promises a card list; destination is the programme page | Keep until a co-brand filter exists; then repoint |
| Co-branded cards | Etihad Guest cards |  | `/airlines/etihad-guest/` | 3 | live | As above | Keep |
| Co-branded cards | Marriott Bonvoy cards |  | `/airlines/marriott-bonvoy/` | 3 | live | As above | Keep |
| Co-branded cards | All co-branded cards |  | `/cards/` | 2 | live | Mystery: there is no co-branded filter; lands on the full directory | Cut, or build the filter (F-029) |
| Learn about UAE cards | Beginner's guide |  | `/guides/expat-starter/` | 4 | live | Onboarding | Keep |
| Learn about UAE cards | AECB credit score |  | `/guides/aecb-credit-report-walkthrough/` | 4 | live | Eligibility explainer | Keep |
| Learn about UAE cards | Salary transfer explained |  | `/salary-transfer/` | 3 | live | Label promises an explainer; destination is the live tracker | Point to /guides/salary-transfer-mechanics-2026/ or relabel "Salary-transfer tracker" (F-031) |
| Learn about UAE cards | Card reviews methodology |  | `/editorial-policy/` | 3 | live | Label promises the scoring method; /editorial-policy/how-we-score/ exists and is the closer match | Repoint to /editorial-policy/how-we-score/ |

## Header — mega-menu 2 (Earn miles ▾)

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
| UAE bank programmes | Emirates NBD Rewards |  | `/banks/emirates-nbd/` | 3 | live | Programme label → bank hub | Keep (hubs carry the programme notes) |
| UAE bank programmes | FAB Rewards |  | `/banks/fab/` | 3 | live | As above | Keep |
| UAE bank programmes | ADCB TouchPoints |  | `/banks/adcb/` | 3 | live | As above | Keep |
| UAE bank programmes | RAKBANK Rewards |  | `/banks/rakbank/` | 3 | live | As above | Keep |
| UAE bank programmes | All bank programmes |  | `/banks/` | 3 | live | Duplicate of "All issuers" (Cards panel) and the primary "Banks" item | Cut (F-029) |
| Airline programmes | Emirates Skywards | 2.0 fils · DP value | `/airlines/skywards/` | 5 | live | Programme page | Keep |
| Airline programmes | Etihad Guest | 2.0 fils · DP value | `/airlines/etihad-guest/` | 5 | live | Programme page | Keep |
| Airline programmes | Qatar Privilege Club | ~3.0 fils · DP value | `/airlines/qatar-privilege-club/` | 5 | live | Programme page | Keep |
| Airline programmes | All airline programmes |  | `/airlines/` | 4 | live | Directory exit | Keep |
| Hotel programmes | Marriott Bonvoy | 2.5 fils · DP value | `/airlines/marriott-bonvoy/` | 5 | live | Programme page (under /airlines/ — F-030) | Keep |
| Hotel programmes | Hilton Honors | 1.5 fils · DP value | `/airlines/hilton-honors/` | 5 | live | Programme page | Keep |
| Hotel programmes | Accor ALL |  | `/airlines/accor-all/` | 5 | live | Programme page | Keep |
| Hotel programmes | All hotel programmes | In the programme directory | `/airlines/` | 2 | live | Same destination as "All airline programmes"; the sub-label "In the programme directory" is an apology for the URL | Cut (F-029); returns when /programmes/ exists (F-030) |
| Learn | Beginner's guide to UAE points |  | `/guides/expat-starter-points-101/` | 5 | live | Onboarding | Keep |
| Learn | DP valuations methodology |  | `/valuations/` | 3 | live | Label names the methodology; destination is the valuations table (methodology is one click further) | Relabel "Points & miles valuations" or repoint to /valuations/methodology/ |
| Learn | Salary-offer calculator |  | `/salary-transfer/calculator/` | 4 | live | Tool | Keep; canonical noun "Salary-transfer calculator" (F-031) |
| Learn | Transfer-partner cheatsheet |  | `/guides/uae-transfer-ratios-2026/` | 4 | live | Reference guide | Keep |

## Header — actions (search, subscribe, theme, hamburger)

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | Search cards, guides… |  | `/search/` | 5 | thin | Search | Keep |
|  | Toggle dark mode |  | `—` | 5 | no-href | Theme toggle (button) | Keep |
|  | Join brief |  | `/newsletter/` | 2 | thin | Mystery label; destination says the brief has not launched (F-012, F-042) | Gate the label on the launch state; "Newsletter" / "Launch list" |
|  | Open menu |  | `—` | 4 | no-href | Hamburger — not keyboard-operable (F-007) | Fix keyboard handling |
|  | DubaiPoints |  | `/` | 4 | live | — | Keep |
|  | Search |  | `/search/` | 5 | thin | Search | Keep |

## Header — quick links row

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | Salary offers |  | `/salary-transfer/` | 4 | live | Quick link to the tracker | Keep; canonical noun (F-031) |
|  | Card deals |  | `/cards/` | 1 | live | Says deals, lands on card reviews — the deals desk exists at /deals/ | Fix href to /deals/ (F-011) |
|  | Latest news |  | `/news/` | 5 | live | Quick link | Keep |

## Header — tracker strip

_Rendered text: Salary offers · Card deals · Latest news_

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | Salary offers |  | `/salary-transfer/` | 4 | live | Quick link to the tracker | Keep; canonical noun (F-031) |
|  | Card deals |  | `/cards/` | 1 | live | Says deals, lands on card reviews — the deals desk exists at /deals/ | Fix href to /deals/ (F-011) |
|  | Latest news |  | `/news/` | 5 | live | Quick link | Keep |

## Header — mobile overlay

_Rendered text: Salary-transfer tracker Open ›_

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
| flat rows | Join brief |  | `/newsletter/` | 2 | thin | Mystery label; destination says the brief has not launched (F-012, F-042) | Gate the label on the launch state; "Newsletter" / "Launch list" |
| flat rows | Cards ▾ |  | `—` | 4 | no-href | Overlay disclosure (checkbox label) | Expose as button (F-007) |
| flat rows | Banks |  | `/banks/` | 5 | live | Issuer hub directory | Keep |
| flat rows | Points + Miles ▾ |  | `—` | 4 | no-href | Overlay disclosure | As above |
| flat rows | Travel ▾ |  | `—` | 3 | no-href | Overlay disclosure: 7 rows for 4 destinations | Collapse to 4 rows (F-029) |
| flat rows | Deals |  | `/deals/` | 4 | thin | Primary nav slot for a three-item desk | Decision F-047: grow the desk or fold the slot |
| flat rows | Guides |  | `/guides/` | 5 | live | Long-form directory | Keep |
| flat rows | News |  | `/news/` | 5 | live | News desk | Keep |
| By card type | Best overall UAE cards | Editor's pick | `/cards/` | 4 | live | Job: pick a card — lands on the directory whose first band is "Top picks this month" | Keep |
| By card type | Best travel cards | Miles & lounge access | `/cards/miles/` | 5 | live | Job: miles card shortlist | Keep |
| By card type | Best cashback cards | Capped & uncapped | `/cards/cashback/` | 5 | live | Job: cashback shortlist | Keep |
| By card type | Best Islamic (Sharia) cards |  | `/cards/islamic/` | 5 | thin | Job: Sharia-compliant shortlist (9 cards) | Keep |
| By card type | Cards by your salary | AED 5k to 30k+ | `/cards/salary/` | 5 | live | Job: eligibility-first browse | Keep |
| By card type | Card finder | Match a card to your spend | `/cards/finder/` | 4 | live | Tool | Keep |
| By card type | All cards |  | `/cards/` | 5 | live | Site column | Keep |
| By bank issuer | FAB cards |  | `/banks/fab/` | 3 | live | Label says cards; destination is the bank hub (which lists them below the fold) | Keep; consider "FAB" to match the hub h1 |
| By bank issuer | Emirates NBD cards |  | `/banks/emirates-nbd/` | 3 | live | As above | Keep |
| By bank issuer | ADCB cards |  | `/banks/adcb/` | 3 | live | As above | Keep |
| By bank issuer | RAKBANK cards |  | `/banks/rakbank/` | 3 | live | As above | Keep |
| By bank issuer | Emirates Islamic cards | Islamic | `/banks/emirates-islamic/` | 3 | live | As above | Keep |
| By bank issuer | All issuers |  | `/banks/` | 4 | live | Directory exit | Keep |
| Co-branded cards | Emirates Skywards cards |  | `/airlines/skywards/` | 3 | live | Label promises a card list; destination is the programme page | Keep until a co-brand filter exists; then repoint |
| Co-branded cards | Etihad Guest cards |  | `/airlines/etihad-guest/` | 3 | live | As above | Keep |
| Co-branded cards | Marriott Bonvoy cards |  | `/airlines/marriott-bonvoy/` | 3 | live | As above | Keep |
| Co-branded cards | All co-branded cards |  | `/cards/` | 2 | live | Mystery: there is no co-branded filter; lands on the full directory | Cut, or build the filter (F-029) |
| Learn about UAE cards | Beginner's guide |  | `/guides/expat-starter/` | 4 | live | Onboarding | Keep |
| Learn about UAE cards | AECB credit score |  | `/guides/aecb-credit-report-walkthrough/` | 4 | live | Eligibility explainer | Keep |
| Learn about UAE cards | Salary transfer explained |  | `/salary-transfer/` | 3 | live | Label promises an explainer; destination is the live tracker | Point to /guides/salary-transfer-mechanics-2026/ or relabel "Salary-transfer tracker" (F-031) |
| Learn about UAE cards | Card reviews methodology |  | `/editorial-policy/` | 3 | live | Label promises the scoring method; /editorial-policy/how-we-score/ exists and is the closer match | Repoint to /editorial-policy/how-we-score/ |
| UAE bank programmes | Emirates NBD Rewards |  | `/banks/emirates-nbd/` | 3 | live | Programme label → bank hub | Keep (hubs carry the programme notes) |
| UAE bank programmes | FAB Rewards |  | `/banks/fab/` | 3 | live | As above | Keep |
| UAE bank programmes | ADCB TouchPoints |  | `/banks/adcb/` | 3 | live | As above | Keep |
| UAE bank programmes | RAKBANK Rewards |  | `/banks/rakbank/` | 3 | live | As above | Keep |
| UAE bank programmes | All bank programmes |  | `/banks/` | 3 | live | Duplicate of "All issuers" (Cards panel) and the primary "Banks" item | Cut (F-029) |
| Airline programmes | Emirates Skywards | 2.0 fils · DP value | `/airlines/skywards/` | 5 | live | Programme page | Keep |
| Airline programmes | Etihad Guest | 2.0 fils · DP value | `/airlines/etihad-guest/` | 5 | live | Programme page | Keep |
| Airline programmes | Qatar Privilege Club | ~3.0 fils · DP value | `/airlines/qatar-privilege-club/` | 5 | live | Programme page | Keep |
| Airline programmes | All airline programmes |  | `/airlines/` | 4 | live | Directory exit | Keep |
| Hotel programmes | Marriott Bonvoy | 2.5 fils · DP value | `/airlines/marriott-bonvoy/` | 5 | live | Programme page (under /airlines/ — F-030) | Keep |
| Hotel programmes | Hilton Honors | 1.5 fils · DP value | `/airlines/hilton-honors/` | 5 | live | Programme page | Keep |
| Hotel programmes | Accor ALL |  | `/airlines/accor-all/` | 5 | live | Programme page | Keep |
| Hotel programmes | All hotel programmes | In the programme directory | `/airlines/` | 2 | live | Same destination as "All airline programmes"; the sub-label "In the programme directory" is an apology for the URL | Cut (F-029); returns when /programmes/ exists (F-030) |
| Learn | Beginner's guide to UAE points |  | `/guides/expat-starter-points-101/` | 5 | live | Onboarding | Keep |
| Learn | DP valuations methodology |  | `/valuations/` | 3 | live | Label names the methodology; destination is the valuations table (methodology is one click further) | Relabel "Points & miles valuations" or repoint to /valuations/methodology/ |
| Learn | Salary-offer calculator |  | `/salary-transfer/calculator/` | 4 | live | Tool | Keep; canonical noun "Salary-transfer calculator" (F-031) |
| Learn | Transfer-partner cheatsheet |  | `/guides/uae-transfer-ratios-2026/` | 4 | live | Reference guide | Keep |
| Airlines | Airline news |  | `/news/airlines/` | 5 | live | Desk index | Keep |
| Airlines | Airline programmes |  | `/airlines/` | 4 | live | Directory | Keep |
| Airlines | Airline deals | From DXB / AUH / SHJ | `/deals/` | 3 | thin | Sub-label "From DXB / AUH / SHJ" promises a filtered view; lands on the unfiltered three-item desk | Cut until a travel filter exists |
| Airlines | All airline stories |  | `/news/airlines/` | 2 | live | Duplicate of "Airline news" (same href) | Cut (F-029) |
| Hotels | Hotel news |  | `/news/hotels/` | 5 | thin | Desk index (177 words, 1 story) | Keep |
| Hotels | Hotel programmes | In the programme directory | `/airlines/` | 3 | live | Directory with an apology sub-label | Keep one of the two rows |
| Hotels | All hotel stories |  | `/news/hotels/` | 2 | thin | Duplicate of "Hotel news" | Cut (F-029) |
| tools block | Salary-transfer tracker | Sources watched weekly | `/salary-transfer/` | 5 | live | Tool | Keep — this is the canonical label |
| tools block | Points & miles valuations | DP value | `/valuations/` | 5 | live | Tool | Keep — canonical label for /valuations/ |
| tools block | Card compare | Side-by-side specs | `/cards/compare/` | 4 | live | Tool | Keep ("Compare cards" in the footer — pick one) |
| tools block | Salary-offer calculator |  | `/salary-transfer/calculator/` | 4 | live | Tool | Keep; canonical noun "Salary-transfer calculator" (F-031) |
| publication block | About DubaiPoints |  | `/about/` | 5 | live | Trust | Keep |
| publication block | Editorial policy |  | `/editorial-policy/` | 5 | live | Trust | Keep |
| publication block | How we make money |  | `/how-we-make-money/` | 5 | live | Trust | Keep |
| publication block | Corrections log |  | `/corrections/` | 5 | live | Trust | Keep |
| publication block | Submit a tip |  | `/tip/` | 5 | live | Reader action | Keep |
| publication block | Press |  | `/press/` | 4 | live | Trust (stamp 9 May — F-058) | Keep |
| publication block | Glossary |  | `/glossary/` | 5 | live | Reference | Keep |
| overlay foot / live strip | EN · العربية |  | `—` | 1 | empty | Language switch with no href and no Arabic edition — honest-nav failure (F-028) | Cut |
| overlay foot / live strip | © 2026 DubaiPoints |  | `—` | 5 | no-href | Legal line | Keep |

## Footer — Salary transfer

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | Salary tracker |  | `/salary-transfer/` | 4 | live | Column lead | Relabel "Salary-transfer tracker" (F-031) |
|  | Calculator |  | `/salary-transfer/calculator/` | 3 | live | Bare "Calculator" in a column that also has /calculator/ elsewhere on the site | Relabel "Salary-transfer calculator" |
|  | AED 5,000 – 8,000 |  | `/salary-transfer/aed-5000-to-8000/` | 5 | live | Band landing (label is the band) | Keep |
|  | AED 8,000 – 15,000 |  | `/salary-transfer/aed-8000-to-15000/` | 5 | live | Band landing (label is the band) | Keep |
|  | AED 15,000 – 30,000 |  | `/salary-transfer/aed-15000-to-30000/` | 5 | live | Band landing (label is the band) | Keep |
|  | AED 30,000 – 50,000 |  | `/salary-transfer/aed-30000-to-50000/` | 5 | live | Band landing (label is the band) | Keep |
|  | AED 50,000+ |  | `/salary-transfer/aed-50000-plus/` | 5 | live | Band landing (label is the band) | Keep |

## Footer — Banks

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | AD Abu Dhabi Commercial Bank |  | `/banks/adcb/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | AD Abu Dhabi Islamic Bank |  | `/banks/adib/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | AH Al Hilal Bank |  | `/banks/al-hilal/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | C Citibank |  | `/banks/citi/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | CB Commercial Bank of Dubai |  | `/banks/cbd/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | DI Dubai Islamic Bank |  | `/banks/dib/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | EI Emirates Islamic |  | `/banks/emirates-islamic/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | EN Emirates NBD |  | `/banks/emirates-nbd/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | FA First Abu Dhabi Bank |  | `/banks/fab/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | H HSBC |  | `/banks/hsbc/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | L Liv |  | `/banks/liv/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | M Mashreq |  | `/banks/mashreq/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | R RAKBANK |  | `/banks/rakbank/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | SC Standard Chartered |  | `/banks/standard-chartered/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |
|  | WB Wio Bank |  | `/banks/wio/` | 5 | live | Issuer hub | Keep (fallback initials read aloud — F-046) |

## Footer — Programmes

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | Accor ALL |  | `/airlines/accor-all/` | 5 | live | Programme page | Keep |
|  | Etihad Guest |  | `/airlines/etihad-guest/` | 5 | live | Programme page | Keep |
|  | Hilton Honors |  | `/airlines/hilton-honors/` | 5 | live | Programme page | Keep |
|  | Marriott Bonvoy |  | `/airlines/marriott-bonvoy/` | 5 | live | Programme page (under /airlines/ — F-030) | Keep |
|  | Qatar Privilege Club |  | `/airlines/qatar-privilege-club/` | 5 | live | Programme page | Keep |
|  | Emirates Skywards |  | `/airlines/skywards/` | 5 | live | Programme page | Keep |

## Footer — Site

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | All cards |  | `/cards/` | 5 | live | Site column | Keep |
|  | Compare cards |  | `/cards/compare/` | 5 | live | Site column | Keep |
|  | AED valuations |  | `/valuations/` | 4 | live | Site column | Keep (align label with the header) |
|  | Guides |  | `/guides/` | 5 | live | Long-form directory | Keep |
|  | Expat Starter |  | `/guides/expat-starter/` | 4 | live | Single guide promoted in the Site column (Title Case, unlike every other label) | Sentence-case: "Expat starter guide" |
|  | Best-of roundups |  | `/best-of/` | 4 | thin | 240 words; roundup tiles | Verify the tiles are live before promoting; else cut |
|  | All topics |  | `/topics/` | 4 | thin | Topic index (224 words) | Keep |
|  | Search |  | `/search/` | 5 | thin | Search | Keep |
|  | RSS |  | `/rss.xml` | 5 | live | Feed (41 items) | Keep |

## Footer — Trust

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | Why we built it |  | `/about/` | 3 | live | Second label for /about/ (header says "About DubaiPoints") | Use one label |
|  | Editorial policy |  | `/editorial-policy/` | 5 | live | Trust | Keep |
|  | How we make money |  | `/how-we-make-money/` | 5 | live | Trust | Keep |
|  | Partnerships |  | `/partnership/` | 5 | live | Trust | Keep |
|  | Corrections log |  | `/corrections/` | 5 | live | Trust | Keep |
|  | The team |  | `/team/` | 5 | live | Trust | Keep |
|  | Glossary |  | `/glossary/` | 5 | live | Reference | Keep |
|  | Press |  | `/press/` | 4 | live | Trust (stamp 9 May — F-058) | Keep |
|  | Submit a tip |  | `/tip/` | 5 | live | Reader action | Keep |
|  | Contact |  | `mailto:info@dubaipoints.ae` | 5 | external | Mail | Keep |

## Footer — brand + bottom bar

_Rendered text: DubaiPoints is independent and not affiliated with any bank or financial institution. Content is for informational purposes only — always verify terms directly with the provider._

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
|  | DubaiPoints. |  | `/` | 5 | live | Brand | Keep |
|  | Join the Friday brief → |  | `/newsletter/` | 3 | thin | Footer CTA to the same unlaunched page | Same gate as the header |
|  | info@dubaipoints.ae |  | `mailto:info@dubaipoints.ae` | 5 | external | Mail | Keep |

## Homepage chrome (all main links)

| Group | Label | Sub-label | Goes to | Clarity (1-5) | Content | Purpose verdict | Recommendation |
|---|---|---|---|---|---|---|---|
| main | Start with a tool ↗ |  | `#tools` | 4 | fragment | Hero primary CTA (in-page) | Use → not ↗ (F-067) |
| main | Read the latest → |  | `#latest` | 4 | fragment | Hero secondary CTA | Keep |
| main | Featured read Dubai Shopping Festival 2026: the card-stacking playbook Guide · U |  | `/guides/dubai-shopping-festival-2026/` | 5 | live | Guide | Keep |
| Start with a tool. | Card finder Rank 57 cards against your spending ↗ |  | `/cards/finder/` | 4 | live | Tool | Keep |
| Start with a tool. | Compare cards Shortlist your next UAE card side by side ↗ |  | `/cards/compare/` | 5 | live | Site column | Keep |
| Start with a tool. | Welcome-bonus calculator See which welcome offer pays back first ↗ |  | `/calculator/` | 2 | live | Label names a tool the page says it is not (F-021) | Relabel "Spend-return calculator" |
| Start with a tool. | Salary-offer calculator Match your salary band to live offers ↗ |  | `/salary-transfer/calculator/` | 4 | live | Tool | Keep; canonical noun "Salary-transfer calculator" (F-031) |
| What's live right now. | Full tracker → |  | `/salary-transfer/` | 5 | live | Live-desk row / tracker exit | Keep (add end date — F-023) |
| What's live right now. | Dubai Islamic Bank up to AED 3,000 cash · 5 bands · from AED 5,000+ salary · Sha |  | `/salary-transfer/dib/` | 5 | live | Live-desk row / tracker exit | Keep (add end date — F-023) |
| What's live right now. | Emirates Islamic up to AED 4,000 cash · 6 bands · from AED 5,000+ salary · Shari |  | `/salary-transfer/emirates-islamic/` | 5 | live | Live-desk row / tracker exit | Keep (add end date — F-023) |
| What's live right now. | First Abu Dhabi Bank up to AED 9,000 cash · 6 bands · from AED 5,000+ salary Ver |  | `/salary-transfer/fab/` | 5 | live | Live-desk row / tracker exit | Keep (add end date — F-023) |
| What's live right now. | HSBC up to AED 2,000 cash · 2 bands · from AED 10,000+ salary Verified 6 Aug 202 |  | `/salary-transfer/hsbc/` | 5 | live | Live-desk row / tracker exit | Keep (add end date — F-023) |
| What's live right now. | Mashreq up to AED 4,000 cash · 4 bands · from AED 5,000+ salary Verified 22 Aug |  | `/salary-transfer/mashreq/` | 5 | live | Live-desk row / tracker exit | Keep (add end date — F-023) |
| What's live right now. | All deals → |  | `/deals/` | 4 | thin | Desk exit (3 deals) | Keep; see F-047 |
| What's live right now. | First Abu Dhabi Bank Amazon.ae — 10% off once a month with a FAB Mastercard, thr |  | `/deals/fab-amazon-10pct-monthly/` | 5 | live | Deal | Keep |
| What's live right now. | First Abu Dhabi Bank FAB salary transfer — up to AED 9,000 cashback over 12 mont |  | `/deals/fab-salary-cashback-2026/` | 5 | live | Deal | Keep |
| What's live right now. | HSBC HSBC Advance — AED 750 cashback for opening the account in-app, by 31 Decem |  | `/deals/hsbc-advance-750-cashback/` | 5 | live | Deal | Keep |
| Fresh from the desk. | View all guides → |  | `/guides/` | 5 | live | Guide | Keep |
| Fresh from the desk. | Search cards, miles, banks… Search |  | `/search/` | 5 | thin | Search | Keep |
| Fresh from the desk. | Guide Updated 22 Aug Ramadan iftars on points: hotel buffets, bank-card 2-for-1s |  | `/guides/ramadan-iftars-on-points/` | 5 | live | Guide | Keep |
| Fresh from the desk. | Card review Verified 22 Aug Liv Cashback Credit Card Liv · annual fee AED 0 Duba |  | `/cards/liv-cashback/` | 5 | live | Card / directory | Keep |
| Fresh from the desk. | News Filed 22 Aug Al Hilal's 'up to AED 15,000' salary campaign ended 4 August — |  | `/news/al-hilal-15000-salary-campaign-quietly-ended/` | 5 | live | Story / desk | Keep |
| Fresh from the desk. | News desk → |  | `/news/` | 5 | live | News desk | Keep |
| Fresh from the desk. | Deals desk → |  | `/deals/` | 4 | thin | Primary nav slot for a three-item desk | Decision F-047: grow the desk or fold the slot |
| What are you optimising for? | 1 Emirates NBD Etihad Guest Visa Elevate Emirates NBD Etihad Guestranked on trav |  | `/cards/emirates-nbd-etihad-guest-elevate/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 2 Emirates NBD Etihad Guest Visa Inspire Emirates NBD Etihad Guestranked on trav |  | `/cards/emirates-nbd-etihad-guest-inspire/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 3 FAB Etihad Guest Infinite First Abu Dhabi Bank Etihad Guestranked on travel ea |  | `/cards/fab-etihad-guest-infinite/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | Guide Skywards business-class redemptions from Dubai: the 2026 playbook Updated |  | `/guides/skywards-business-class-redemptions-2026/` | 5 | live | Guide | Keep |
| What are you optimising for? | Tool Rank miles cards for travel spend Card finder → |  | `/cards/finder/?spend=travel&prefer=miles` | 4 | live | Pre-filtered finder | Keep; make controls reflect the URL (F-039) |
| What are you optimising for? | 1 Wio Credit (Mastercard World) Wio Bank 2% backon everything else |  | `/cards/wio-credit/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 2 ADCB Essential Cashback Credit Card Abu Dhabi Commercial Bank 1% backon everyt |  | `/cards/adcb-essential-cashback/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 3 Mashreq Cashback Credit Card Mashreq 1% backon everything else |  | `/cards/mashreq-cashback/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | Guide Best entry-level cards in the UAE (AED 5,000–8,000 salary) — 2026 Updated |  | `/guides/best-entry-level-cards-2026/` | 5 | live | Guide | Keep |
| What are you optimising for? | Tool Rank cashback cards for your spend Card finder → |  | `/cards/finder/?spend=general&prefer=cashback` | 4 | live | Pre-filtered finder | Keep; make controls reflect the URL (F-039) |
| What are you optimising for? | 1 Emirates NBD Marriott Bonvoy World Elite Mastercard Emirates NBD ≈ AED 5,000we |  | `/cards/emirates-nbd-marriott-bonvoy-world-elite/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 2 Emirates NBD Etihad Guest Visa Elevate Emirates NBD ≈ AED 4,000welcome value |  | `/cards/emirates-nbd-etihad-guest-elevate/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 3 Emirates NBD Skywards Infinite Emirates NBD ≈ AED 2,000welcome value |  | `/cards/emirates-nbd-skywards-infinite/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | Guide Best premium cards in the UAE (AED 30,000+ salary) — 2026 Updated 11 Jun |  | `/guides/best-premium-cards-2026/` | 5 | live | Guide | Keep |
| What are you optimising for? | Tool See which welcome offer pays back first Welcome-bonus calculator → |  | `/calculator/` | 4 | live | — | Keep |
| What are you optimising for? | 1 Wio Credit (Mastercard World) Wio Bank AED 0 fee |  | `/cards/wio-credit/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 2 Liv Cashback Credit Card Liv AED 0 fee |  | `/cards/liv-cashback/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | 3 ADCB Essential Cashback Credit Card Abu Dhabi Commercial Bank AED 0 feefrom AE |  | `/cards/adcb-essential-cashback/` | 5 | live | Card / directory | Keep |
| What are you optimising for? | Guide Choosing your first UAE credit card (2026): an expat's guide Updated 6 May |  | `/guides/expat-starter-first-credit-card/` | 5 | live | Guide | Keep |
| What are you optimising for? | Tool Entry-level cards under AED 500 a year Card finder → |  | `/cards/finder/?salary=8000&fee=under-500` | 4 | live | Pre-filtered finder | Keep; make controls reflect the URL (F-039) |
| hp-dir | 57 cards Credit-card reviews Cashback, miles and Islamic cards compared on fees, |  | `/cards/` | 5 | live | Card / directory | Keep |
| hp-dir | 15 banks Bank guides Every covered UAE issuer — fees, eligibility and card line- |  | `/banks/` | 4 | live | — | Keep |
| hp-dir | 6 programmes Miles & loyalty Skywards, Etihad Guest, Qatar and the hotel program |  | `/airlines/` | 4 | live | — | Keep |
| hp-dir | Live tracker Salary-transfer offers Band-by-band cash and rate offers across UAE |  | `/salary-transfer/` | 5 | live | Live-desk row / tracker exit | Keep (add end date — F-023) |
| hp-dir | 3 live Lifestyle deals Time-bound UAE dining, retail and travel offers — dated, |  | `/deals/` | 5 | thin | Deal | Keep |
| hp-dir | 21 guides Guides Expat starter series, eligibility, AECB credit, transfer ratios |  | `/guides/` | 5 | live | Guide | Keep |
| hp-trust | Publication Who writes DubaiPoints A UAE-resident, single-editor publication usi |  | `/team/` | 5 | live | Trust | Keep |
| hp-trust | Method How we work Card figures draw on issuer product pages, terms, Key Facts S |  | `/editorial-policy/` | 5 | live | Trust | Keep |
| hp-trust | Funding How we make money No affiliate-driven recommendations. No paid placement |  | `/how-we-make-money/` | 5 | live | Trust | Keep |
| hp-trust | about DubaiPoints |  | `/about/` | 5 | live | Trust | Keep |
| hp-trust | corrections policy |  | `/corrections/` | 5 | live | Trust | Keep |
| hp-trust | how we value miles + points |  | `/valuations/methodology/` | 5 | live | Trust | Keep |
| The Friday brief is preparing for launch. | Editorial policy |  | `/editorial-policy/` | 5 | live | Trust | Keep |
| The Friday brief is preparing for launch. | RSS feeds |  | `/rss.xml` | 5 | live | Feed (41 items) | Keep |
| The Friday brief is preparing for launch. | info@dubaipoints.ae |  | `mailto:info@dubaipoints.ae?subject=Join%20the%20Friday%20brief` | 4 | external | — | Keep |

## Aggregate findings

- **Mystery-navigation count (clarity ≤ 2): 12**
  - Header — mega-menu 1 (Credit cards ▾): “All co-branded cards” → /cards/
  - Header — mega-menu 2 (Earn miles ▾): “All hotel programmes” → /airlines/
  - Header — actions (search, subscribe, theme, hamburger): “Join brief” → /newsletter/
  - Header — quick links row: “Card deals” → /cards/
  - Header — tracker strip: “Card deals” → /cards/
  - Header — mobile overlay: “Join brief” → /newsletter/
  - Header — mobile overlay: “All co-branded cards” → /cards/
  - Header — mobile overlay: “All hotel programmes” → /airlines/
  - Header — mobile overlay: “All airline stories” → /news/airlines/
  - Header — mobile overlay: “All hotel stories” → /news/hotels/
  - Header — mobile overlay: “EN · العربية” → —
  - Homepage chrome (all main links): “Welcome-bonus calculator See which welcome offer pays back first ↗” → /calculator/
- **Empty-destination count: 1** (a label with nothing behind it)
  - Header — mobile overlay: “EN · العربية”
- **Thin destinations: 15**
  - Footer — Site: “All topics” → /topics/ (224 words)
  - Footer — Site: “Best-of roundups” → /best-of/ (240 words)
  - Footer — brand + bottom bar: “Join the Friday brief →” → /newsletter/ (235 words)
  - Header — actions (search, subscribe, theme, hamburger): “Join brief” → /newsletter/ (235 words)
  - Header — desktop primary nav: “Deals” → /deals/ (127 words)
  - Header — mega-menu 1 (Credit cards ▾): “Best Islamic (Sharia) cards” → /cards/islamic/ (100 words)
  - Header — mobile overlay: “Airline deals” → /deals/ (127 words)
  - Header — mobile overlay: “All hotel stories” → /news/hotels/ (177 words)
  - Header — mobile overlay: “Best Islamic (Sharia) cards” → /cards/islamic/ (100 words)
  - Header — mobile overlay: “Deals” → /deals/ (127 words)
  - Header — mobile overlay: “Hotel news” → /news/hotels/ (177 words)
  - Header — mobile overlay: “Join brief” → /newsletter/ (235 words)
  - Homepage chrome (all main links): “3 live Lifestyle deals Time-bound UAE dining, retail and travel offers — dated,” → /deals/ (127 words)
  - Homepage chrome (all main links): “All deals →” → /deals/ (127 words)
  - Homepage chrome (all main links): “Deals desk →” → /deals/ (127 words)
- **Duplicate-label count (same label, different destinations): 0**
- **Near-duplicate labels (different destinations):** “Beginner's guide” → /guides/expat-starter/ vs “Beginner's guide to UAE points” → /guides/expat-starter-points-101/; “Calculator” (footer) → /salary-transfer/calculator/ vs “Welcome-bonus calculator” → /calculator/; “Salary offers” / “Salary tracker” / “Salary-transfer tracker” → one page (F-031).
- **Same destination, three or more labels: 18**
  - `/cards/` ← 6 labels: 57 cards Credit-card reviews Cashback, miles and Islamic cards compared on fees,; All cards; All co-branded cards; Best overall UAE cards; Card deals; Credit cards ▾
  - `/airlines/` ← 6 labels: 6 programmes Miles & loyalty Skywards, Etihad Guest, Qatar and the hotel program; Airline programmes; All airline programmes; All hotel programmes; Earn miles ▾; Hotel programmes
  - `/salary-transfer/` ← 6 labels: Full tracker; Live tracker Salary-transfer offers Band-by-band cash and rate offers across UAE; Salary offers; Salary tracker; Salary transfer explained; Salary-transfer tracker
  - `/deals/` ← 5 labels: 3 live Lifestyle deals Time-bound UAE dining, retail and travel offers — dated,; Airline deals; All deals; Deals; Deals desk
  - `/cards/finder/` ← 5 labels: Card finder; Card finder Rank 57 cards against your spending; Tool Entry-level cards under AED 500 a year Card finder; Tool Rank cashback cards for your spend Card finder; Tool Rank miles cards for travel spend Card finder
  - `/banks/` ← 4 labels: 15 banks Bank guides Every covered UAE issuer — fees, eligibility and card line-; All bank programmes; All issuers; Banks
  - `/guides/` ← 3 labels: 21 guides Guides Expat starter series, eligibility, AECB credit, transfer ratios; Guides; View all guides
  - `/news/` ← 3 labels: Latest news; News; News desk
  - `/banks/fab/` ← 3 labels: FA First Abu Dhabi Bank; FAB Rewards; FAB cards
  - `/banks/emirates-nbd/` ← 3 labels: EN Emirates NBD; Emirates NBD Rewards; Emirates NBD cards
  - `/banks/adcb/` ← 3 labels: AD Abu Dhabi Commercial Bank; ADCB TouchPoints; ADCB cards
  - `/banks/rakbank/` ← 3 labels: R RAKBANK; RAKBANK Rewards; RAKBANK cards
  - `/editorial-policy/` ← 3 labels: Card reviews methodology; Editorial policy; Method How we work Card figures draw on issuer product pages, terms, Key Facts S
  - `/valuations/` ← 3 labels: AED valuations; DP valuations methodology; Points & miles valuations
  - `/salary-transfer/calculator/` ← 3 labels: Calculator; Salary-offer calculator; Salary-offer calculator Match your salary band to live offers
  - `/search/` ← 3 labels: Search; Search cards, guides…; Search cards, miles, banks… Search
  - `/cards/compare/` ← 3 labels: Card compare; Compare cards; Compare cards Shortlist your next UAE card side by side
  - `/about/` ← 3 labels: About DubaiPoints; Why we built it; about DubaiPoints
- **"Cut these" (10)**
  - Header — mega-menu 1 (Credit cards ▾): “All co-branded cards” → /cards/ — Cut, or build the filter (F-029)
  - Header — mega-menu 2 (Earn miles ▾): “All bank programmes” → /banks/ — Cut (F-029)
  - Header — mega-menu 2 (Earn miles ▾): “All hotel programmes” → /airlines/ — Cut (F-029); returns when /programmes/ exists (F-030)
  - Header — mobile overlay: “All co-branded cards” → /cards/ — Cut, or build the filter (F-029)
  - Header — mobile overlay: “All bank programmes” → /banks/ — Cut (F-029)
  - Header — mobile overlay: “All hotel programmes” → /airlines/ — Cut (F-029); returns when /programmes/ exists (F-030)
  - Header — mobile overlay: “Airline deals” → /deals/ — Cut until a travel filter exists
  - Header — mobile overlay: “All airline stories” → /news/airlines/ — Cut (F-029)
  - Header — mobile overlay: “All hotel stories” → /news/hotels/ — Cut (F-029)
  - Header — mobile overlay: “EN · العربية” → — — Cut
- **"Add these"**
  - "How we score" → /editorial-policy/how-we-score/ under Cards ▸ Learn (replaces the misdirected "Card reviews methodology")
  - "Banking news" → /news/banking/ (currently reachable only from the news layout switcher — 29 Aug §2 item 6)
  - "Offer history" per bank row on /salary-transfer/ (15 history pages have one inbound link each — F-013)
  - "Spend-return calculator" → /calculator/ in the footer Site column if the second calculator is kept (F-032)
  - The eight "checked, no live offer" bank pages linked from the tracker coverage note (F-013)

## Standards Editor cross-check

Voice and kill-list compliance per surface (Standards lens applied to the chrome strings; the two completed Council finder results for the Homepage are merged here and credited):

| Surface | Verdict | Notes |
|---|---|---|
| Header — desktop nav | pass-with-edits | Sentence case throughout; "Earn miles ▾" is the one label that undersells its panel (bank + airline + hotel programmes). No first-person plural in chrome. |
| Header — Cards mega-menu | pass-with-edits | "All co-branded cards" promises a filter that does not exist (mystery); "Salary transfer explained" and "Card reviews methodology" promise explainers and land on a tracker and a policy page. Sub-labels ("Editor's pick", "AED 5k to 30k+") are the strongest microcopy on the site — the AED format "5k" is the only place the house "AED 5,000" rule is abbreviated; acceptable in a sub-label, record it. |
| Header — Earn-miles mega-menu | pass-with-edits | "DP valuations methodology" → the table, not the methodology; "All hotel programmes · In the programme directory" is an apology for the URL (F-030). DP-value sub-labels ("2.0 fils · DP value") are correct and consistent with `src/lib/valuations.ts` (the 29 Aug guard). |
| Header — actions and quick links | fail | "Join brief" is a mystery label (Council standards-editor; F-042) whose destination says the brief has not launched (F-012); "Card deals" → /cards/ is a wrong destination (F-011). Two of six action/quick-link strings fail rule 4. |
| Header — mobile overlay | pass-with-edits | Mirrors the panels (same defects); the first row is the newsletter CTA; "EN · العربية" is an inert promise (F-028); the Travel panel has seven rows for four pages. |
| Footer — five columns | pass-with-edits | "Why we built it" and "About DubaiPoints" name the same page; "Calculator" is bare; "Expat Starter" is the only Title-Case label; bank rows read their fallback initials aloud (F-046). Column structure (Salary transfer / Banks / Programmes / Site / Trust) is honest and complete. |
| Homepage chrome | pass-with-edits | Council standards-editor: seven labels for one salary-transfer product (F-031); "Welcome-bonus calculator" names a tool the page disowns (F-021); launch-pending status stated three times (F-043); ↗ used for in-page anchors (F-067); "Start here" as the sixth band (F-066); two search prompts (F-064); "Verified" with and without year (F-065). Council head-of-ux: 5-second test passes at both widths; hero stack pushes the featured story below the 390 fold (F-053). |

Uppercase accessible names: the header links render in small caps via CSS `text-transform`, and Chromium exposes the transformed text ("JOIN BRIEF", "SALARY OFFERS") to assistive technology. Screen readers cope with words; they spell out anything that looks like an acronym. No action beyond not adding acronym-shaped labels.


## Disposition

A1 is **delivered**. Implementation tickets route as follows (Managing Editor): the wrong destination (F-011) and the inert language switch (F-028) are T1 fixes for the Standards Editor this week; duplicate rows and the Travel-panel collapse (F-029) are one T2 Header.astro change for the Head of UX; the newsletter CTA gate (F-012) and the calculator label (F-021) need the Chairman's answer on launch timing; the hotel-programme route (F-030) waits for a T3 convening. Re-run `node chrome-inventory.mjs` (kept in the evidence folder) after the Header change and diff the row count.

