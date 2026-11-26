import type { CardData } from "./cardsData";
import { earnIsPercentage, earnRateFieldPending, formatAED, formatEarnRate, isStructuredAnnualFeeWaiver, loyaltyTag } from "./cardsDataFormat";
import { cardFeeNeedsReview } from "./cardFeeProvenance";
import { publicCardIssuerTermUrl } from "./cardIssuerReferences";

// Shared source-qualified ranking inputs and their matching display strings.
// Derive both from L2; this is not a new rate, AED valuation or extraction.
const spendKeys = ["dining", "groceries", "travel", "fuel", "online", "everythingElse"] as const;

export function finderEvidence(card: CardData & { slug?: string }) {
  const pending = (key: string) => card._provenance?.[key] === "needs-review";
  const fieldHeld = (group: string) => Object.entries(card._provenance ?? {}).some(([key, state]) =>
    state === "needs-review" && (key === group || key.startsWith(group + ".")));
  // The legacy classifier treats an empty programme as cashback. Finder
  // needs positive evidence for that preference, not just a missing name.
  const programme = card.loyaltyProgram?.trim();
  const rewardPreference = fieldHeld("loyaltyProgram") ? null
    : programme ? (card._provenance?.loyaltyProgram === "editor-confirmed-null" ? null : loyaltyTag(programme))
    : !fieldHeld("categories") && card.categories.includes("cashback") ? "cashback" as const : null;
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
  const { amount: annualFee } = card.annualFee;
  const comparableAnnualFee = annualFeePending || card.standardFeeConditions || !Number.isFinite(annualFee)
    || annualFee < 0 || (annualFee > 0 && card.vatPolicy === "exclusive") ? null : annualFee;
  const waiver = card.annualFeeWaiver;
  const firstYearAnnualFeeWaived = !fieldHeld("annualFeeWaiver") && isStructuredAnnualFeeWaiver(waiver) && waiver.year_one_waived;
  const fee = annualFeePending
    ? "Annual fee: confirmation pending."
    : card.standardFeeConditions === "renewal-only"
      ? `Standard renewal fee from year two: ${priced(annualFee)}; first-year terms pending.`
    : card.standardFeeConditions === "renewal-waiver"
      ? `Standard renewal fee from year two: ${priced(annualFee)}; ${firstYearAnnualFeeWaived ? "annual fee waived in year one" : "first-year terms pending"}.`
    : card.standardFeeConditions === "kfs-renewal-cohort"
      ? "The Key Facts Statement lists a primary annual-fee waiver in year one. Renewal is not used for ranking; check the profile for the published basis and legacy rates."
    : card.standardFeeConditions === "standard-only"
      ? `Standard annual fee: ${priced(annualFee)} before any waiver; what applies in each year is unconfirmed.`
    : annualFee === 0
      ? "No listed annual fee."
      : `Listed annual fee: ${priced(annualFee)} before any waiver.`;
  const feeNotes = [fee];
  if (cardFeeNeedsReview(card, "joiningFee")) {
    feeNotes.push("Joining fee: confirmation pending.");
  } else if (card.joiningFee && card.joiningFee.amount !== card.annualFee.amount) {
    const joining = card.joiningFee;
    const label = joining.amount > 0 && joining.vatTreatment === "unspecified"
      ? `${formatAED(joining.amount)} (VAT not specified)` : priced(joining.amount);
    feeNotes.push(`Listed joining fee: ${label}.`);
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
    comparableAnnualFee,
    rewardPreference,
    earnLabels,
    feeNotes,
    feeExcludesVat: !annualFeePending && card.annualFee.amount > 0 && card.vatPolicy === "exclusive",
    capNotes,
    categoryCaps,
    salaryPending: card.eligibility.minSalary === null || pending("eligibility") || pending("eligibility.minSalary"),
    salaryLabel: card.eligibility.minSalary !== null && card.eligibility.minSalary > 0 ? formatAED(card.eligibility.minSalary) : null,
    sourceUrl: publicCardIssuerTermUrl(card),
  };
}
