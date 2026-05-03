# Brand notes — open questions

Items below are **open** — Phase 1.5 scaffolding uses neutral placeholders so
the answers don't bottleneck implementation. Decisions wanted before Phase 4
(content launch).

---

## 1. Logo direction

- **Option A — text wordmark.** Currently shipping. `dubaipoints.ae` with
  brand-blue accent on the TLD. Easy to flex the brand beyond points content
  (banking, salary transfer) without a new mark.
- **Option B — symbol + wordmark.** A geometric mark inspired by the Dubai
  skyline, AED dirham symbol, or the Khor Dubai inlet. More memorable but
  pigeon-holes the brand visually.

Recommendation: **A** for launch. Re-visit at 6-month mark once tone of voice
and visual direction have settled.

---

## 2. Primary brand colour

- **Option A — gold/navy classic.** Reads "premium financial publication";
  conservative but unoriginal in this niche.
- **Option B — UAE flag green/red.** On-the-nose but easily looks tourist-y.
- **Option C — distinctive electric blue.** Currently shipping (`#1e6bd6`).
  Differentiates from HfP (their green) and TPG (their navy). UAE-readable
  without being flag-themed.

Recommendation: **C**. If revisited, pair the blue with a single accent like
warm amber for highlights / "eligible" states.

---

## 3. Tone of voice

- **Option A — HfP dry / British.** Skeptical of marketing, comfortable
  saying "this card is bad". Strong fit for our positioning.
- **Option B — TPG enthusiastic.** "Best", "amazing", "you'll love". Reads
  like a marketing partner — not the lane we want.
- **Option C — neutral journalistic.** Closer to FT-Adviser. Authoritative
  but can feel detached.

Recommendation: **A with C's discipline on facts**. Dry but evidence-led.

---

## 4. Tagline

- **Option A — "Maximise your UAE points and miles."** Point-centric, narrow.
  Boxes us in if we expand into salary transfer (which we already have).
- **Option B — "UAE rewards, banking and travel decoded."** Currently shipping
  on the homepage as the strapline. Broader, fits the IA we just built.
- **Option C — "Honest UAE rewards analysis."** Positions on integrity, but
  "honest" is a trust claim that's hard to deliver in a tagline.

Recommendation: **B**.

---

## 5. Comment system

- **Option A — giscus (GitHub-Discussions-backed).** Free, no DB, low spam.
  Requires a GitHub account from commenters — high friction in MENA.
- **Option B — Disqus.** Familiar, low friction, but ad-laden in free tier and
  privacy-questionable.
- **Option C — None at launch.** Use a "send tips" email link instead. Add
  comments later only if reader demand justifies the moderation overhead.

Recommendation: **C** for launch; **A** at the 3-month mark if engagement
data justifies it. Reader login friction is real.

---

## 6. Newsletter platform

Required feature: **tagged segments by salary band**, so we can email the
"AED 30k–50k" cohort when an offer drops for them without spamming the rest of
the list. This is a Phase 4 feature; the platform decision matters now because
content production should reference the segmentation.

- **Option A — Buttondown.** Supports tagged segments natively, simple API,
  reasonable pricing. Recommended.
- **Option B — ConvertKit / Kit.** More mature segmentation, more expensive,
  more complex than we need.
- **Option C — Beehiiv.** Strong growth-tooling, but segmentation is recipe-
  based and clunkier than Buttondown's tag system.

Recommendation: **A — Buttondown**.

---

## 7. RSS-by-salary-band feasibility

**Question:** can we offer separate RSS feeds per salary band so readers
subscribe only to the offers relevant to them?

**Verdict — yes, low cost.** Generate one feed per band at build time:

```
/rss/salary-transfer/aed-5000-to-8000.xml
/rss/salary-transfer/aed-8000-to-15000.xml
/rss/salary-transfer/aed-15000-to-30000.xml
/rss/salary-transfer/aed-30000-to-50000.xml
/rss/salary-transfer/aed-50000-plus.xml
/rss/salary-transfer.xml          (everything)
/rss.xml                          (site-wide: everything + cards + guides)
```

Implementation: `@astrojs/rss` integration, one route per band that queries
`salaryTransferOffers` filtered by band. Estimate: half a day of work in
Phase 3.

This pairs naturally with Buttondown's tagged segments — readers can choose
either email or RSS, segmented identically.

---

## Decisions wanted before Phase 4

| # | Question | Default if no answer |
|---|---|---|
| 1 | Logo direction | A (text wordmark) |
| 2 | Brand colour | C (electric blue) |
| 3 | Tone | A (HfP dry) |
| 4 | Tagline | B (broader) |
| 5 | Comments at launch | C (none) |
| 6 | Newsletter | A (Buttondown) |
| 7 | RSS-by-band | Yes, build in Phase 3 |
