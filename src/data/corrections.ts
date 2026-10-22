/**
 * The public corrections log.
 *
 * WHY THIS FILE EXISTS. `/corrections/` was hardcoded HTML: two entries
 * written by hand inside the page, with no machine-readable dates and no
 * count. Adding a third meant editing markup, and nothing on the page or
 * anywhere else could say how many corrections we have published or when the
 * last one was — so the log could not be cited as evidence of the thing it
 * exists to prove.
 *
 * That matters because a public corrections log is one of the four things
 * the 2026-06-12 ruling names as our trust posture: "verifiable figures,
 * per-field provenance, named verification dates, and a public corrections
 * log — claims about process the site can actually demonstrate." A claim you
 * cannot count is not demonstrated. Moved to data on 10 September 2026,
 * alongside the F-051 work that made the trust pages scannable.
 *
 * The entries below are migrated verbatim from the page's prose. Nothing was
 * reworded in the move.
 *
 * A correction is permanent. Entries are never edited to soften them and
 * never removed once the page is fixed.
 */

export interface Correction {
  /** The day the correction was published. Machine-readable on purpose. */
  date: Date;
  /** Short title — what was wrong, and how many pages it touched. */
  title: string;
  /** Card slugs affected, for the count and for cross-linking. */
  cardsAffected: string[];
  /** What we originally published. HTML, because the entries carry links. */
  original: string;
  /** What is true, and what we changed. HTML. */
  corrected: string;
}

export const corrections: readonly Correction[] = [
  {
    date: new Date("2026-10-22"),
    title: "ADCB talabat earn structure and ENBD Duo base rate",
    cardsAffected: ["adcb-talabat", "emirates-nbd-duo"],
    original:
      'our <a href="/cards/adcb-talabat/">ADCB talabat</a> review said the card paid a flat <strong>1.25%</strong> back, and its card data recorded the earn as "1 talabat Pro per AED 1" on a Visa. Our <a href="/cards/emirates-nbd-duo/">ENBD Duo</a> review said spend below the AED 5,000 monthly threshold earned <strong>0.5%</strong> in the bonus categories.',
    corrected:
      'ADCB\'s product page (read 22 October 2026) gives <strong>35% back as talabat credit</strong> on the first 10 talabat orders each month (up to AED 35 an order, AED 350 a month, with AED 2,500 of monthly retail spend), 1.25% on other spend and 0.35% in ten listed categories; the card is a <strong>Mastercard</strong>, and talabat pro is a free delivery membership, not a points currency. Emirates NBD\'s page gives the Duo <strong>1.5%</strong> in the bonus categories below the threshold, and 0.5% on all other spend; our card data was right and the review had the two rates swapped. Both reviews, the talabat card data and our no-annual-fee guide were corrected on 22 October 2026.',
  },
  {
    date: new Date("2026-10-19"),
    title: "ENBD LuLu 247 Titanium, Skywards lounge networks and Liv welcome bonus",
    cardsAffected: [
      "emirates-nbd-lulu-247-titanium",
      "emirates-nbd-skywards-signature",
      "emirates-nbd-skywards-infinite",
      "liv-cashback",
      "liv-cashback-plus",
    ],
    original:
      'we listed lounge access on the <a href="/cards/emirates-nbd-lulu-247-titanium/">LuLu 247 Titanium</a> with an AED 8,000 minimum salary and out-of-date earn rates; we gave the <a href="/cards/emirates-nbd-skywards-signature/">Skywards Signature</a> six DragonPass lounge visits a year and the <a href="/cards/emirates-nbd-skywards-infinite/">Skywards Infinite</a> DragonPass access; and we showed a 10,000 Skywards Miles welcome bonus on the <a href="/cards/liv-cashback/">Liv Cashback</a> cards.',
    corrected:
      'Emirates NBD\'s product pages (read 19 October 2026): the LuLu 247 Titanium\'s lounge access was discontinued from 1 May 2025, its minimum salary is AED 5,000 and it earns 3.5% at LuLu, 2% on fuel, 1% on utilities and 0.35% elsewhere; both Skywards cards use <strong>Visa Airport Companion</strong>, unlimited on the Signature. The Liv "10,000 Miles" figure was the monthly cap on converting to Skywards, not a welcome bonus, so the bonus is now shown as none. The reviews, card data and comparisons were corrected on 19–20 October 2026.',
  },
  {
    date: new Date("2026-10-01"),
    title: "FAB Elite and FAB World Elite earn rates",
    cardsAffected: ["fab-elite", "fab-world-elite"],
    original:
      'we said the <a href="/cards/fab-elite/">FAB Elite</a> earned <strong>1 FAB Reward per AED 1</strong> on everyday spend, and valued FAB Rewards at <strong>AED 0.02</strong> each, which put its luxury-spend return at 40% (AED 4,000 a month at the cap). We said the <a href="/cards/fab-world-elite/">FAB World Elite</a> earned <strong>10 FAB Rewards per AED 1</strong> on international spend and 1 on everything else. Neither base rate, nor the 10× international rate, had a primary source.',
    corrected:
      'FAB\'s Rewards terms and conditions (April 2025, version 4) give both cards <strong>5 FAB Rewards per AED 1</strong> on domestic and international spend, and 0.5 in excluded categories such as supermarkets, fuel and utilities. The World Elite has no international bonus. The same terms equate 334,000 FAB Rewards to AED 1,000 (the FAB Cashback card\'s monthly cap), so we now use an indicative <strong>AED 0.003</strong> each, and the FAB Elite\'s luxury return at the cap is about 6% (AED 600 a month). Both reviews, their card data and our premium-cards guide were corrected on 1 October 2026.',
  },
  {
    date: new Date("2026-06-11"),
    title: "ENBD Darna partner network",
    cardsAffected: [
      "emirates-nbd-darna-select-visa",
      "emirates-nbd-darna-visa-signature",
      "emirates-nbd-darna-visa-infinite",
    ],
    original:
      'our reviews of the <a href="/cards/emirates-nbd-darna-select-visa/">Darna Select</a>, <a href="/cards/emirates-nbd-darna-visa-signature/">Darna Signature</a> and <a href="/cards/emirates-nbd-darna-visa-infinite/">Darna Infinite</a> described the cards\' 10%/7.5%/6.25% partner earn as applying at <strong>Emaar</strong> destinations — Dubai Mall, Address hotels, Reel Cinemas — and recommended them to Dubai-based Emaar spenders.',
    corrected:
      'Darna is <strong>Aldar\'s</strong> loyalty programme. The partner earn applies at Aldar destinations — Yas Mall, Yas Island theme parks, Aldar hotels, spas and golf courses in Abu Dhabi — per the Emirates NBD product pages, verified 11 June 2026. All three reviews were rewritten the same day; the cards are now framed for Aldar-community residents and Yas Island regulars, which is who they actually serve. The Darna Infinite\'s fee break-even was also corrected from "roughly AED 15,000 a month" of partner spend to roughly AED 1,300 a month — the original figure misread an annual threshold as monthly.',
  },
  {
    date: new Date("2026-05-29"),
    title: "ADCB foreign-currency fee",
    cardsAffected: [
      "adcb-365-cashback",
      "adcb-essential-cashback",
      "adcb-lulu-platinum",
      "adcb-lulu-titanium-gold",
      "adcb-shukran",
      "adcb-talabat",
      "adcb-touchpoints-infinite",
      "adcb-touchpoints-platinum",
      "adcb-touchpoints-titanium-gold",
      "adcb-betaqti",
    ],
    original:
      'we listed the foreign-currency transaction fee on ten ADCB cards as <strong>0.525%</strong>, and the <a href="/cards/adcb-essential-cashback/">ADCB Essential Cashback review</a> promoted that figure as a reason to get the card.',
    corrected:
      'the published fee is <strong>2.99%</strong>, per the ADCB Schedule of Fees Ver.46 (February 2026). The 0.525% figure was ADCB\'s charge for cash deposits and withdrawals in foreign currency — a different line in the same fee schedule — picked up in error by our data pipeline. All ten card pages were corrected the same day, and the Essential Cashback review\'s argument was rebuilt around the true cost of overseas spend. The <a href="/cards/adcb-traveller/">ADCB Traveller</a>, which genuinely carries 0% FX, was unaffected.',
  },
];

/** Newest first. The order the log reads in. */
export const correctionsByDate = (): Correction[] =>
  [...corrections].sort((a, b) => b.date.getTime() - a.date.getTime());

/** The most recent correction's date, or null before there are any. */
export const lastCorrectionDate = (): Date | null =>
  correctionsByDate()[0]?.date ?? null;

/** Distinct card pages touched across the whole log. */
export const cardsCorrected = (): number =>
  new Set(corrections.flatMap((c) => c.cardsAffected)).size;
