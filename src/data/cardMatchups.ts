/**
 * Curated head-to-head card matchups, one static page each at
 * /cards/compare/<a>-vs-<b>/.
 *
 * WHY CURATED. 57 reviewed cards make 1,596 possible pairs, and a page per
 * pair would be 1,596 pages carrying a templated sentence — the thin-content
 * shape the 2026-07-27 honest-nav rule exists to prevent. A matchup earns a
 * page when a reader plausibly holds both in mind at once: the same currency
 * at two tiers, the same job at two price points, or two cards a shortlist
 * would put side by side. Every entry carries a written verdict; a pair
 * without one does not ship, and tests/cards/matchups.test.ts enforces that.
 *
 * WHAT THE VERDICT MAY SAY. Judgement, not arithmetic. The numbers come from
 * the L2 spec table the page renders beneath it, so a fee or rate that moves
 * in cards.json moves on the page without anyone remembering to edit prose.
 * A verdict that restates a figure is a figure that can go stale silently —
 * exactly how /valuations/ ended up publishing a promise it did not keep.
 *
 * Added 10 September 2026. The gap it fills: /cards/compare/ had no
 * indexable pair URL at all, and its ?cards= state could not render in a
 * static build.
 */

export interface CardMatchup {
  /** Left column. Conventionally the more accessible of the two. */
  left: string;
  /** Right column. */
  right: string;
  /** One line under the H1 — what question this pair answers. */
  deck: string;
  /**
   * The editor's call, in prose. Two to four sentences. Names no figure the
   * table below it already carries.
   */
  verdict: string[];
}

export const cardMatchups: readonly CardMatchup[] = [
  {
    left: "liv-cashback",
    right: "wio-credit",
    deck: "Two free-for-life cashback cards with no salary floor and no transfer condition.",
    verdict: [
      "Wio, on the numbers in the table below. It pays a higher flat rate on everything, and its monthly cashback ceiling is more than three times Liv's, so the gap widens rather than closing as spend rises.",
      "Liv's case is the account behind it rather than the card. If your salary already lands in Liv and you want one app for both, the difference is small in absolute dirhams at low spend. If it does not, there is no argument here.",
    ],
  },
  {
    left: "liv-cashback",
    right: "adcb-365-cashback",
    deck: "A free flat-rate card against a category card with a fee and a spend gate.",
    verdict: [
      "This one turns on whether your spending is concentrated. ADCB 365 pays several times Liv's rate on dining, fuel and entertainment, which covers its fee comfortably for a household that spends there — and pays nothing at all in a month where total card spend falls under its gate.",
      "Liv asks nothing and gates nothing. If your spend is spread thin, or uneven month to month, the flat card keeps what the category card forfeits.",
    ],
  },
  {
    left: "emirates-nbd-skywards-signature",
    right: "emirates-nbd-skywards-infinite",
    deck: "The same Skywards Miles at two tiers, two fees and two salary floors.",
    verdict: [
      "The Infinite earns a third more on every category and carries more than twice the fee, so it is a spend-volume question rather than a preference. Its fee waiver is the deciding term for most holders: it is conditional on an annual spend threshold that the Signature's is not.",
      "Both earn per US dollar, not per dirham, which is why the mile counts in the table are lower than the rate numbers suggest. The salary floors differ enough that the choice is often made for you.",
    ],
  },
  {
    left: "emirates-nbd-etihad-guest-inspire",
    right: "fab-etihad-guest-infinite",
    deck: "The same Etihad Guest Miles from two issuers, at very different fees.",
    verdict: [
      "The Inspire is the better-value card on ordinary spend: its everyday rate is higher than the FAB card's and its fee is a fraction of it. The FAB Infinite earns more only on international spend, and charges a higher foreign-transaction fee to do it.",
      "The FAB card's argument is its Accelerator option, which lifts every category to a single flat rate for a monthly fee — worth modelling only if your card spend is high and evenly spread. At a normal spend level the Inspire wins on both sides of the ledger.",
    ],
  },
  {
    left: "emirates-nbd-marriott-bonvoy-world",
    right: "emirates-nbd-marriott-bonvoy-world-elite",
    deck: "Free against AED 1,575 for the same Bonvoy currency, doubled.",
    verdict: [
      "The Elite earns exactly twice the World on every category, so the whole question is whether your annual Bonvoy earning is worth more than the fee at the published baseline. The table shows both rates; the valuations page shows what a point is worth.",
      "One term separates them beyond the fee: the Elite requires a salary transfer and the World does not. If you are not moving your salary, the comparison is settled before the earn rates matter.",
    ],
  },
  {
    left: "emirates-nbd-share-visa-signature",
    right: "emirates-nbd-share-visa-infinite",
    deck: "Two SHARE cards where the free one is not obviously the worse one.",
    verdict: [
      "The Infinite earns more at Carrefour and the other partner brands, and half again on general spend — but it carries a fee the Signature does not, and its waiver terms are the weaker of the two.",
      "Both cut their rate sharply on groceries, fuel and utilities, so the partner-brand rate is doing almost all the work on either card. Judge them on how much of your spend actually lands with the partners; on everything else the difference is small.",
    ],
  },
  {
    left: "emirates-nbd-noon-one",
    right: "mashreq-cashback",
    deck: "Two free everyday cards, one paying inside an ecosystem and one in cash.",
    verdict: [
      "The noon One pays a far higher rate than anything else here, but in noon credits and only on noon — outside that it is an ordinary flat-rate card. It is a good card if your groceries and food delivery already run through noon, and unremarkable if they do not.",
      "Mashreq pays real cashback and pays it anywhere, with a strong dining rate. Note its bill-bundle rate, which is very low and covers a wide list of everyday categories; the table carries the current figures.",
    ],
  },
  {
    left: "emirates-nbd-voyager-world",
    right: "adcb-traveller",
    deck: "A free travel-miles card against a premium travel-cashback card at zero FX.",
    verdict: [
      "The Traveller is the stronger card for someone who books flights and hotels on it: it pays a double-digit cashback rate on both, and charges no foreign-transaction fee at all, which is rare in this market. It also carries a high fee with no waiver, so it needs the travel spend to make sense.",
      "The Voyager World costs nothing and earns miles rather than dirhams, but we publish no baseline for that currency, so we do not present an AED figure for it. Treat the two as answering different questions rather than as a like-for-like.",
    ],
  },
  {
    left: "hsbc-live-plus",
    right: "emirates-islamic-switch-cashback",
    deck: "Near-identical fees, a conventional card and a Sharia-compliant one.",
    verdict: [
      "Emirates Islamic pays the higher headline rates in every shared category and applies a lower minimum monthly spend to qualify, which makes it the better card for most spending profiles at this fee.",
      "HSBC's counter is its waiver, which clears at a much lower annual spend. Both cap their bonus categories tightly in dirhams per month, so the headline rates are reached on a smaller slice of spend than they appear to cover — the caps are in the table.",
    ],
  },
  {
    left: "fab-cashback",
    right: "citi-cashback",
    deck: "Two mid-fee cashback cards at the same price, with different shapes.",
    verdict: [
      "FAB pays more on dining and shopping and Citi pays more on international spend, so the answer follows your largest category rather than the headline rate. FAB also gates earning behind a minimum previous-month spend, which Citi does not.",
      "Citi's fee waiver is threshold-based and reachable at a moderate annual spend; FAB's card has no waiver. Over a year that term is worth more than the rate difference for most holders.",
    ],
  },
] as const;

/** URL segment for a matchup, e.g. "liv-cashback-vs-wio-credit". */
export const matchupSlug = (m: CardMatchup): string => `${m.left}-vs-${m.right}`;

/** Matchups that involve a given card, for cross-linking from its review. */
export const matchupsForCard = (slug: string): CardMatchup[] =>
  cardMatchups.filter((m) => m.left === slug || m.right === slug);
