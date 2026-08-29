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
  delta90: string;
  status: "Active" | "Pending" | "Under review";
}

export const programmeValuations: ProgrammeValuation[] = [
  { slug: "skywards",             name: "Emirates",        currencyName: "Skywards",      mark: "SKY", floor: null, ceiling: null, dpValue: 2.0,  delta90: "—", status: "Active" },
  { slug: "etihad-guest",         name: "Etihad",          currencyName: "Guest",         mark: "ETI", floor: null, ceiling: null, dpValue: 2.0,  delta90: "—", status: "Active" },
  { slug: "qatar-privilege-club", name: "Qatar",           currencyName: "Avios",         mark: "QR",  floor: null, ceiling: null, dpValue: 3.0,  delta90: "—", status: "Active" },
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
  const v = dpValueFils(slug);
  return v == null ? undefined : `${v.toFixed(1)} fils · DP value`;
}

// Date the published baselines were last confirmed against the
// programme overview pages — NOT the build date. A build-date stamp
// manufactured freshness for numbers that hadn't moved.
export const baselinesConfirmed = new Date("2026-06-10");
