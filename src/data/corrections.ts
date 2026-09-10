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
