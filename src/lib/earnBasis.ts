/**
 * How a card's `earnRates` numbers are denominated, parsed from the
 * free-text `earnUnit` string in L2.
 *
 * WHY THIS EXISTS. `earnRates` is a bare number per category and `earnUnit`
 * is prose, so nothing in the data says whether `1.5` means "1.5 percent of
 * spend", "1.5 points per AED 1", "1.5 miles per AED 10" or "1.5 miles per
 * USD 1". The rewards calculator multiplied spend by the rate and applied one
 * AED-per-unit rate per programme, which silently mixed all four:
 *
 *   - percent-denominated cards came out 100x too high — /calculator/ told a
 *     reader that AED 7,800 of monthly spend earned "48,300 % cashback ≈
 *     AED 48,300" a month on the RAKBANK World card;
 *   - Etihad Guest cards (miles per AED 10) came out 10x high on the
 *     denominator before any valuation error;
 *   - Skywards and Bonvoy cards (per USD 1) treated AED spend as USD.
 *
 * Found 10 September 2026. The parser is deliberately strict and total: an
 * `earnUnit` it does not recognise returns `null` rather than a default, and
 * `tests/calculator/earn-basis.test.ts` asserts a basis for every card in
 * cards.json, so a new card with unfamiliar wording fails the suite instead
 * of quietly earning a wrong number.
 *
 * Charter §6 discipline: deterministic parsing only, same as the scrape
 * parsers in scripts/scrape/_lib.ts. No inference, no LLM.
 */

/** What one unit of `earnRates` is denominated in. */
export type EarnBasis =
  /** The rate is a percentage of spend. `1.5` means 1.5% back. */
  | { kind: "percent" }
  /** The rate is native units earned per `perAED` of spend. */
  | { kind: "perAED"; perAED: number }
  /** The rate is native units earned per USD 1 of spend. */
  | { kind: "perUSD" };

/**
 * AED per USD, used only to convert a spend figure into the USD denominator
 * a card earns on. The dirham has been pegged at 3.6725 since 1997; this is
 * a currency peg, not a rate we estimate.
 */
export const AED_PER_USD = 3.6725;

/**
 * Parse `earnUnit` into the denominator its rates are expressed in.
 * Returns `null` when the wording does not state one — the caller must then
 * keep the card out of any AED comparison rather than guess.
 */
export function parseEarnBasis(earnUnit: string | undefined | null): EarnBasis | null {
  if (!earnUnit) return null;
  const unit = earnUnit.trim();
  if (unit.length === 0) return null;

  // Per USD 1 — Skywards and Bonvoy co-brands earn on the USD-converted
  // amount. Checked before the AED forms so "per USD 1" never falls through.
  if (/\bper\s+USD\s*1\b/i.test(unit)) return { kind: "perUSD" };

  // Per AED <n> spent. The n is load-bearing: Etihad Guest earns per AED 10,
  // one ENBD card per AED 200.
  const perAed = /\bper\s+AED\s*([\d,]+)\b/i.exec(unit);
  if (perAed) {
    const n = Number(perAed[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return { kind: "perAED", perAED: n };
    return null;
  }

  // A leading percent sign, or any "% <something>" phrasing, means the rate
  // is a percentage of spend: "% cashback", "% as ENBD Plus Points",
  // "% back as LuLu Points", "% value back as Darna Points".
  if (/^%/.test(unit) || /\b%\s*(cashback|as|back|value)\b/i.test(unit)) {
    return { kind: "percent" };
  }

  return null;
}

/**
 * Native units earned on `spendAED` at `rate`, given the card's basis.
 * For a percent card the "native unit" is a percentage point, so the caller
 * should render it as a percentage rather than a count.
 */
export function nativeEarned(spendAED: number, rate: number, basis: EarnBasis): number {
  switch (basis.kind) {
    case "percent":
      return (spendAED * rate) / 100;
    case "perAED":
      return (spendAED / basis.perAED) * rate;
    case "perUSD":
      return (spendAED / AED_PER_USD) * rate;
  }
}

/**
 * True when the card's native unit is already AED — a percentage-denominated
 * cashback card. `nativeEarned` then returns dirhams and no currency
 * valuation applies.
 */
export function earnsAED(earnUnit: string | undefined | null, basis: EarnBasis): boolean {
  if (basis.kind !== "percent") return false;
  return /cashback|aed back|aed cashback|credits?\b/i.test(earnUnit ?? "");
}
