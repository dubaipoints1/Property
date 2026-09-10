// DP-value baselines — the single source of truth for fils-per-point
// figures rendered in site chrome and on /valuations/.
//
// These carry only the baselines actually published in the programme
// overviews (and used by card reviews) — see
// .council/sops/value-to-me-convention.md. The earlier illustrative
// figures (Skywards 3.5, Etihad 2.8, …) contradicted the 2-fil
// baseline the reviews cite; a reader cross-checking a review against
// the valuations page got a different number (Fact-Checker redline,
// 11 June 2026). The header mega-menu kept serving the retracted
// figures until 29 August 2026 because it carried its own copies —
// which is why this module exists: chrome and tables import the same
// rows, and tests/nav/header.test.ts asserts no fils figure in nav
// copy disagrees with it.
//
// NOT RENDERED. Chairman ruling R10, 10 September 2026 (audit F-018)
// cut the Floor, Ceiling, Distribution and 90-day-delta columns from
// /valuations/ because all four were a dash on all ten rows. The fields
// stay here so the columns come back in one commit once real figures
// exist — populate these, then restore the columns.
// Floor/ceiling ranges and 90-day deltas return when the DP-value
// methodology lands — they are not published until they can be traced.

export interface ProgrammeValuation {
  /** Site route slug under /airlines/, null when no page exists yet. */
  slug: string | null;
  name: string;
  currencyName: string;
  mark: string;
  floor: number | null;
  ceiling: number | null;
  dpValue: number | null;
  /** True when every published reference writes the baseline as
   * approximate (e.g. Qatar Avios "~3 fils" per the value-to-me SOP) —
   * chrome must not render it as an exact figure. */
  approx?: boolean;
  delta90: string;
  status: "Active" | "Pending" | "Under review";
}

export const programmeValuations: ProgrammeValuation[] = [
  { slug: "skywards",             name: "Emirates",        currencyName: "Skywards",      mark: "SKY", floor: null, ceiling: null, dpValue: 2.0,  delta90: "—", status: "Active" },
  { slug: "etihad-guest",         name: "Etihad",          currencyName: "Guest",         mark: "ETI", floor: null, ceiling: null, dpValue: 2.0,  delta90: "—", status: "Active" },
  { slug: "qatar-privilege-club", name: "Qatar",           currencyName: "Avios",         mark: "QR",  floor: null, ceiling: null, dpValue: 3.0,  approx: true, delta90: "—", status: "Active" },
  { slug: null,                   name: "British Airways", currencyName: "Avios",         mark: "BA",  floor: null, ceiling: null, dpValue: null, delta90: "—", status: "Pending" },
  { slug: "marriott-bonvoy",      name: "Marriott",        currencyName: "Bonvoy",        mark: "MAR", floor: null, ceiling: null, dpValue: 2.5,  delta90: "—", status: "Active" },
  { slug: null,                   name: "IHG",             currencyName: "One Rewards",   mark: "IHG", floor: null, ceiling: null, dpValue: null, delta90: "—", status: "Pending" },
  { slug: "hilton-honors",        name: "Hilton",          currencyName: "Honors",        mark: "HIL", floor: null, ceiling: null, dpValue: 1.5,  delta90: "—", status: "Active" },
  { slug: null,                   name: "flydubai",        currencyName: "OPEN",          mark: "FZ",  floor: null, ceiling: null, dpValue: null, delta90: "—", status: "Pending" },
  { slug: null,                   name: "Wizz Air",        currencyName: "Discount Club", mark: "W6",  floor: null, ceiling: null, dpValue: null, delta90: "—", status: "Pending" },
  { slug: null,                   name: "Air Arabia",      currencyName: "Airewards",     mark: "G9",  floor: null, ceiling: null, dpValue: null, delta90: "—", status: "Pending" },
];

/** Published DP-value baseline in fils for a programme slug, or null. */
export function dpValueFils(slug: string): number | null {
  return programmeValuations.find((p) => p.slug === slug)?.dpValue ?? null;
}

/** Nav-chrome sub-line for a programme, e.g. "2.0 fils · DP value". */
export function dpValueSub(slug: string): string | undefined {
  const p = programmeValuations.find((e) => e.slug === slug);
  if (p?.dpValue == null) return undefined;
  return `${p.approx ? "~" : ""}${p.dpValue.toFixed(1)} fils · DP value`;
}

// Date the published baselines were last confirmed against the
// programme overview pages — NOT the build date. A build-date stamp
// manufactured freshness for numbers that hadn't moved.
export const baselinesConfirmed = new Date("2026-06-10");

/**
 * Maps a card's L2 `loyaltyProgram` string to the programme slug above, so
 * the rewards calculator values a currency at exactly the figure this page
 * publishes rather than keeping a second table of its own.
 *
 * It had one: `AED_PER_UNIT` in RewardsCalculator.tsx priced a mile at 4
 * fils against the 2.0 published here, and hotel points at 0.8 against
 * Bonvoy's 2.5 — so /calculator/ ranked miles cards at double their
 * published value and hotel cards at a third, on the page that links to
 * /valuations/methodology/ as though the numbers came from it. Chairman
 * ruling 2 of 12 June 2026 says card arithmetic uses these baselines.
 *
 * Keys are the exact strings in cards.json. A programme absent from this
 * map has no published baseline; the caller must say so rather than guess,
 * and `tests/calculator/published-rates.test.ts` fails if a mapped name
 * stops matching a card or a row.
 */
export const VALUATION_SLUG_BY_LOYALTY_PROGRAM: Readonly<Record<string, string>> = {
  "Emirates Skywards": "skywards",
  "Etihad Guest": "etihad-guest",
  "Marriott Bonvoy": "marriott-bonvoy",
};

/**
 * Published AED per native unit for a card's loyalty programme, or null when
 * this publication has not published a baseline for that currency.
 *
 * Deliberately NOT a fuzzy match. The previous regex over programme + unit
 * text caught "Voyager Miles" on the word "miles" and priced it as if it
 * were Skywards, a currency with a baseline; Voyager has none.
 */
export function publishedAEDPerUnit(loyaltyProgram: string | undefined | null): number | null {
  if (!loyaltyProgram) return null;
  const slug = VALUATION_SLUG_BY_LOYALTY_PROGRAM[loyaltyProgram.trim()];
  if (!slug) return null;
  const fils = dpValueFils(slug);
  return fils == null ? null : fils / 100;
}
