import type { CardData } from "./cardsData";
import { earnIsPercentage, formatAED, formatEarnRate } from "./cardsDataFormat";

// Finder uses these display strings, not new ranking inputs. Derive them
// from the same L2 data as the full card and leave unknowns as unknowns.
const spendKeys = ["dining", "groceries", "travel", "fuel", "online", "everythingElse"] as const;

export function finderEvidence(card: CardData) {
  const pending = (key: string) => card._provenance?.[key] === "needs-review";
  const vat = card.vatPolicy === "exclusive" ? " + VAT" : " incl. VAT";
  const priced = (amount: number) => formatAED(amount) + (amount > 0 ? vat : "");
  const fee = pending("annualFee") || pending("annualFee.amount")
    ? "Annual fee: confirmation pending."
    : card.annualFee.amount === 0
      ? "No listed annual fee."
      : `Listed annual fee: ${priced(card.annualFee.amount)} before any waiver.`;
  const feeNotes = [fee];
  if (pending("joiningFee") || pending("joiningFee.amount")) {
    feeNotes.push("Joining fee: confirmation pending.");
  } else if (card.joiningFee && card.joiningFee.amount !== card.annualFee.amount) {
    feeNotes.push(`Listed joining fee: ${priced(card.joiningFee.amount)}.`);
  }
  if (card.annualFeeWaiver || pending("annualFeeWaiver")) {
    feeNotes.push("Check first-year and renewal waiver terms.");
  }

  const earnLabels = Object.fromEntries(spendKeys.flatMap((key) => {
    const value = card.earnRates[key];
    return typeof value === "number" && !pending("earnRates") && !pending(`earnRates.${key}`)
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
    earnLabels,
    feeNotes,
    feeExcludesVat: card.annualFee.amount > 0 && card.vatPolicy === "exclusive",
    capNotes,
    categoryCaps,
    salaryPending: pending("eligibility") || pending("eligibility.minSalary"),
    salaryLabel: card.eligibility.minSalary > 0 ? formatAED(card.eligibility.minSalary) : null,
    sourceUrl: card.kfsUrl ?? card.sources[0],
  };
}
