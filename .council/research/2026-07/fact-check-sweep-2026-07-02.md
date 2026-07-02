# Fact-check sweep — 2 July 2026

Owner-initiated data-accuracy pass. Scope: the 10 card reviews ranked by
inbound-link weight × verification age. Method: Firecrawl against each
issuer's published KFS/SoF (PDF preferred; product pages where scrapeable).
Verdict: **zero drift** — no L2 figure contradicted a primary source.

| Card | Fee | FX | Earn | Source (version) |
|---|---|---|---|---|
| fab-world-elite | ✓ Free | ✓ 2.49% | not re-checked | FAB consolidated KFS (Jun 2023, current) |
| fab-etihad-guest-infinite | ✓ 2,500+VAT=2,625 | ✓ 2.49% | not re-checked | FAB consolidated KFS |
| fab-cashback | ✓ 300+VAT=315 | ✓ 2.49% | not re-checked | FAB consolidated KFS |
| cbd-one | ✓ Free | ✓ 3.5% | n/a (One Plan; no earn engine) | CBD One KFS (17 Dec 2025) |
| mashreq-cashback | ✓ Free-for-life | ✓ 2.89% | ✓ 5/1/1; fuel 0.15 per 13-Jun notice (KFS VA080526 still shows 0.33 — L2 is *ahead*, correctly) | Mashreq Cards KFS (8 May 2026) |
| adcb-365-cashback | ✓ by version-match | ✓ 2.99% | verified 6 Jun (page) | ADCB SoF **Ver.46/Feb 2026 unchanged** since verification |
| emirates-nbd-skywards-infinite | ✓ renewal 1,575 | ✓ 1.99% (+~1.15% scheme) | not re-checked | ENBD consolidated KFS (3/2024, current) |
| emirates-nbd-skywards-signature | ✓ renewal 735 | ✓ 1.99% | not re-checked | ENBD consolidated KFS |
| emirates-nbd-marriott-bonvoy-world-elite | ✓ renewal 1,575 | ✓ 1.99% | not re-checked | ENBD consolidated KFS |
| hsbc-live-plus | ✓ 299+VAT=313.95 | ✓ 2% | ✓ 6/5/2/2 + 0.5% base, AED 3,000 gate, AED 200 caps | hsbc.ae compare page + charges page |

Notes:
- **HSBC min-salary nuance re-checked**: AED 5,000 applies only at
  HSBC-approved employers; AED 12,500 otherwise. L2 carries 5,000
  (editor-confirmed) and the L3 prose disambiguates in three places
  (cons, eligibility panel, "Higher salary bar off-panel"). Correct as-is.
- **Earn rates for FAB/ENBD co-brands not re-verified**: their KFS docs
  carry fees only, and both banks' product pages are JS-rendered
  (extraction returns empty — the known allowlist/JS constraint).
  Re-verification of miles earn tables is a workstation task or waits
  on the scrape pipeline scaling. `lastVerified` stamps NOT bumped for
  these six; fees+FX confirmation recorded here instead.
- `lastVerified` bumped to 2026-07-02 for the three cards where the
  full volatile set (fee + FX + earn) was re-confirmed today:
  mashreq-cashback, hsbc-live-plus, cbd-one.
- Salary-transfer offers (Mashreq, DIB XTRA) verified 30 June — fresh,
  out of scope.
- Incidental confirmations from the same documents: ENBD Go4it Gold
  103.95 renewal; ADCB SoF still lists the 0.525% cash-FX line that
  the parseFxFee disambiguation guard (test-locked 2 July) protects
  against.

— Fact-check pass, 2 July 2026 (session-run; Firecrawl primary-source scrapes).
