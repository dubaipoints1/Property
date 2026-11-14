import type { CardData } from "./cardsData";
import { earnIsPercentage, earnRateFieldPending, formatAED, formatEarnRate } from "./cardsDataFormat";
import { cardFeeNeedsReview } from "./cardFeeProvenance";

// Shared source-qualified ranking inputs and their matching display strings.
// Derive both from L2; this is not a new rate, AED valuation or extraction.
const spendKeys = ["dining", "groceries", "travel", "fuel", "online", "everythingElse"] as const;

export function finderEvidence(card: CardData & { slug?: string }) {
  const pending = (key: string) => card._provenance?.[key] === "needs-review";
  const pendingEarnKeys = spendKeys.filter(key => !!card.scopedEarnRates?.length || earnRateFieldPending(card._provenance, key));
  // Ranking and explanation must consume the same held-field boundary.
  // Never send a known-held numeric category as an actionable score.
  const rankRates = Object.fromEntries(spendKeys.flatMap(key => {
    const value = card.earnRates[key];
    return typeof value === "number" && Number.isFinite(value) && !pendingEarnKeys.includes(key)
      ? [[key, value]] : [];
  }));
  const vat = card.vatPolicy === "exclusive" ? " + VAT" : " incl. VAT";
  const priced = (amount: number) => formatAED(amount) + (amount > 0 ? vat : "");
  const annualFeePending = cardFeeNeedsReview(card, "annualFee");
  const fee = annualFeePending
    ? "Annual fee: confirmation pending."
    : card.standardFeeConditions === "renewal-only"
      ? `Standard renewal fee from year two: ${priced(card.annualFee.amount)}; first-year terms pending.`
    : card.annualFee.amount === 0
      ? "No listed annual fee."
      : `Listed annual fee: ${priced(card.annualFee.amount)} before any waiver.`;
  const feeNotes = [fee];
  if (cardFeeNeedsReview(card, "joiningFee")) {
    feeNotes.push("Joining fee: confirmation pending.");
  } else if (card.joiningFee && card.joiningFee.amount !== card.annualFee.amount) {
    feeNotes.push(`Listed joining fee: ${priced(card.joiningFee.amount)}.`);
  }
  if (card.annualFeeWaiver || pending("annualFeeWaiver")) {
    feeNotes.push("Check first-year and renewal waiver terms.");
  }

  const earnLabels = Object.fromEntries(spendKeys.flatMap((key) => {
    const value = rankRates[key];
    return typeof value === "number"
      ? [[key, formatEarnRate(value, card.earnUnit, card.categories)]]
      : [];
  }));
  const typedCaps = card.earnRates._caps;
  // The calculator's AED caps are applied only to percentage cashback.
  // A points cap must not be restated as a cash value here either.
  const caps = typedCaps && earnIsPercentage(card.earnUnit, card.categories)
    && !pending("earnRates") && !pending("earnRates._caps") ? typedCaps : undefined;
  const monthlyCap = caps?.monthly_max_aed;
  const spendFloor = caps?.min_monthly_spend_to_qualify_aed;
  const capNotes = [
    card._dataIssues?.earnRates ?? "",
    typeof monthlyCap === "number" && !pending("earnRates._caps.monthly_max_aed")
      ? `Listed overall cap: ${formatAED(monthlyCap)} a month.` : "",
    typeof spendFloor === "number" && spendFloor > 0 && !pending("earnRates._caps.min_monthly_spend_to_qualify_aed")
      ? `Listed qualifying spend: ${formatAED(spendFloor)} a month.` : "",
  ].filter(Boolean);
  const categoryCaps = Object.fromEntries(spendKeys.flatMap((key) => {
    const value = caps?.per_category?.[key]?.monthly_aed;
    return typeof value === "number" && !pending("earnRates._caps.per_category")
      && !pending(`earnRates._caps.per_category.${key}`)
      && !pending(`earnRates._caps.per_category.${key}.monthly_aed`)
      ? [[key, `Listed category cap: ${formatAED(value)} a month.`]] : [];
  }));

  return {
    // A generic all-spend fallback cannot represent the current merchant,
    // payment-channel and reduced-category conditions on this product.
    fallbackPending: card.slug === "adcb-365-cashback" || typeof rankRates.everythingElse !== "number",
    rankRates,
    pendingEarnKeys,
    annualFeePending,
    earnLabels,
    feeNotes,
    feeExcludesVat: !annualFeePending && card.annualFee.amount > 0 && card.vatPolicy === "exclusive",
    capNotes,
    categoryCaps,
    salaryPending: card.eligibility.minSalary === null || pending("eligibility") || pending("eligibility.minSalary"),
    salaryLabel: card.eligibility.minSalary !== null && card.eligibility.minSalary > 0 ? formatAED(card.eligibility.minSalary) : null,
    sourceUrl: card.kfsUrl ?? card.sources[0],
  };
}
