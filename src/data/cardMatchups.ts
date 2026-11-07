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
    deck: "Two cashback cards whose account-plan, spend-tier and credit-limit conditions matter.",
    verdict: [
      "Wio's cashback depends on the account plan, its fee and a cap shared with My Money; the Standard plan earns none. Liv's spend tiers and credit-limit cap also change the result. A headline rate alone cannot settle this comparison, and the generic example does not estimate either card's return.",
      "Start with the account you can qualify for and the conditions you can meet, then check how your actual spending fits the issuer's rules. Neither card should be described as having no salary floor merely because a salary transfer is a separate condition.",
    ],
  },
  {
    left: "liv-cashback",
    right: "adcb-365-cashback",
    deck: "Spend-tier cashback against merchant-specific rewards and qualification conditions.",
    verdict: [
      "ADCB 365's listed subscription rewards depend on named providers and payment channels, while reduced-category and spend conditions also apply. Liv has its own spend tiers and credit-limit cap. Neither is an unrestricted flat return, and this generic comparison does not estimate whether the rewards cover a fee.",
      "Check which merchants and payment channels actually qualify before choosing between them. ADCB eligibility is still being reconciled in this source record; read the pending terms rather than treating a retained income figure as a complete qualification test.",
    ],
  },
  {
    left: "emirates-nbd-skywards-signature",
    right: "emirates-nbd-skywards-infinite",
    deck: "Compare Skywards earning, fees and qualification at two card tiers.",
    verdict: [
      "Compare the source-qualified Skywards earning rows against your actual merchants and transaction currencies. Reduced categories, excluded payments and statement caps mean the headline rate is not a promise on every purchase. Neither tier gets an unrestricted annual-return estimate here.",
      "Check the separately stated joining fee, renewal fee and application-specific waiver before paying for the higher tier. The published salary minimum is only one qualification condition; a pending salary-transfer rule is not evidence that transfer is either compulsory or unnecessary.",
    ],
  },
  {
    left: "emirates-nbd-etihad-guest-inspire",
    right: "fab-etihad-guest-infinite",
    deck: "The same Etihad Guest Miles from two issuers, at very different fees.",
    verdict: [
      "There is no defensible universal winner while the Inspire's product page and linked reward booklet disagree on some earning categories. Those disputed rows are held, not silently resolved in favour of the more attractive number. FAB's welcome wording also needs checking against the exact application offer.",
      "Compare the known fees and the qualifying merchants first. Any optional paid earning enhancement needs its own current terms and cost calculation; it is not part of the default return. Issuer FX charges are not necessarily the complete conversion cost, and an upper bound cannot be ranked as a fixed fee.",
    ],
  },
  {
    left: "emirates-nbd-marriott-bonvoy-world",
    right: "emirates-nbd-marriott-bonvoy-world-elite",
    deck: "Two Bonvoy tiers, with different fees, earning schedules and award conditions.",
    verdict: [
      "Start with the qualifying Marriott and general-retail rows, then check the reduced categories and geographical exceptions. Those source-qualified schedules are more useful than treating all spending as the headline earn rate. A generic annual return is not assumed here.",
      "Free Night Awards are restricted hotel certificates, not interchangeable with transferable Bonvoy points. Check each award's spending, fee-payment, redemption and expiry conditions separately. Do not infer a salary-transfer requirement or its absence from the tier name.",
    ],
  },
  {
    left: "emirates-nbd-share-visa-signature",
    right: "emirates-nbd-share-visa-infinite",
    deck: "Compare SHARE earning and fee conditions at two card tiers.",
    verdict: [
      "The useful question is how much of your eligible spending already lands with the named SHARE partners. Partner earning, reduced categories and statement caps must stay attached to the displayed rates; they are not one flat return on household spending.",
      "Compare the standard fees and the exact waiver offered to you before choosing a tier. Earlier linked gift-voucher campaigns have ended and are not current joining value. The source notes identify any remaining benefit or qualification terms that still need confirmation.",
    ],
  },
  {
    left: "emirates-nbd-noon-one",
    right: "mashreq-cashback",
    deck: "Named-platform credits compared with cash rewards and their qualifying conditions.",
    verdict: [
      "The noon One's accelerated rates belong to specific named platforms, not all dining, delivery or online shopping. Its credits are not unrestricted cash. Use the individual platform rows and combined cap, rather than an ecosystem headline, when judging whether it fits purchases you already make.",
      "Mashreq's dining rewards are subject to the assigned-credit-limit restriction; they are not uncapped. Its everyday-rate wording also needs reconciliation, so we withhold a generic return estimate. Check the exclusions and current issuer terms rather than assuming that every purchase earns the headline rate.",
    ],
  },
  {
    left: "emirates-nbd-voyager-world",
    right: "adcb-traveller",
    deck: "Portal-linked travel miles compared with travel cashback and separate issuer FX charges.",
    verdict: [
      "Traveller's qualifying airfare and hotel cashback must be read with its monthly spending gate, cap and exclusions. Its other-spend row is domestic-only. An issuer processing-fee waiver is not a promise that card-scheme or merchant conversion costs are absent.",
      "Voyager's portal, other travel and qualifying retail rates use its own miles, with reduced categories and a statement cap. We publish no approved AED baseline for that currency. Compare booking channels, reward usability and separately stated fees instead of declaring a like-for-like annual winner.",
    ],
  },
  {
    left: "hsbc-live-plus",
    right: "emirates-islamic-switch-cashback",
    deck: "Conventional and Sharia-compliant cashback, with different qualification and reward conditions.",
    verdict: [
      "Compare the category rates alongside their spend gates and caps, not as a guaranteed return. HSBC's product and KFS eligibility wording remain unreconciled in this source record, so a rate comparison is not a recommendation that you qualify for either card.",
      "Check the applicable mode, qualifying spend, category caps and renewal waiver separately. Neither an advertised category rate nor a previous fee example establishes what your own spending will earn. Unresolved qualification stays visible rather than becoming an approval recommendation.",
    ],
  },
  {
    left: "fab-cashback",
    right: "citi-cashback",
    deck: "Category-led cashback compared with currency-led cashback and their qualifying terms.",
    verdict: [
      "Start with the categories and transaction currencies you actually use, then check the qualifying spending period and cap for each source-stated rate. Do not assume that a retail purchase, a supermarket payment and an overseas transaction use the same earning rule.",
      "Compare confirmed fees and the exact renewal-waiver terms in the reviews. FAB's current FX statement is an issuer upper bound with additional scheme charges, not a fixed total conversion cost. Neither a marketing rate nor a temporary welcome promotion settles the ongoing value on its own.",
    ],
  },
] as const;

/** URL segment for a matchup, e.g. "liv-cashback-vs-wio-credit". */
export const matchupSlug = (m: CardMatchup): string => `${m.left}-vs-${m.right}`;

/** Matchups that involve a given card, for cross-linking from its review. */
export const matchupsForCard = (slug: string): CardMatchup[] =>
  cardMatchups.filter((m) => m.left === slug || m.right === slug);
