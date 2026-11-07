// Model the same eligible, local everyday spend for every card. The inputs
// are canonical L2 terms, not the Finder's cross-unit ranking heuristic.
import { SPEND_PRESETS, presetTotal } from "../data/spendProfiles";
import type { CardData } from "./cardsData";
import { cardRewardModelIssue } from "./cardEarnModel";
import {
  annualFeeWaiverDisplay,
  formatAED,
  isStructuredAnnualFeeWaiver,
} from "./cardsDataFormat";
import { nativeEarned, parseEarnBasis } from "./earnBasis";
import { publishedAEDPerUnit } from "./valuations";

export const DEFAULT_CARD_VALUE_MONTHLY_SPEND = presetTotal(SPEND_PRESETS[0]);
export const MAX_CARD_VALUE_MONTHLY_SPEND = 1_000_000;

export type CardValueTerms = {
  rate: number | null;
  minimum: number | null;
  cap: number | null;
  firstFee: number | null;
  laterFee: number | null;
  assumesYearOneWaiver: boolean;
  hasConditionalRenewalWaiver: boolean;
  annualWaiver: string;
  rewardIssue: string;
  firstFeeIssue: string;
  laterFeeIssue: string;
  pointsBaseline: boolean;
  hasWelcomeOffer: boolean;
};

type CardValue = {
  rewards: number | null;
  first: number | null;
  later: number | null;
  rewardIssue: string;
  capBinds: boolean;
};

// Account plans and statement-wide tiers in these L2 perks are not numeric
// inputs to the model. Do not turn a plan's advertised rate or Liv's floor
// into the reader's rate. Revisit only with typed plan/tier and cap terms.

/** Already-stored VAT convention; do not change the issuer figures in L2. */
function feeWithVAT(amount: number, vatPolicy: CardData["vatPolicy"]): number {
  return vatPolicy === "exclusive" ? Math.round(amount * 105) / 100 : amount;
}

export function cardValueTerms(card: CardData, slug: string): CardValueTerms {
  const pending = (key: string) => card._provenance[key] === "needs-review";
  const basis = parseEarnBasis(card.earnUnit);
  const baseRate = card.earnRates.everythingElse;
  // The old broad cash-unit matcher can also accept merchant credits and
  // branded points called cashback. This comparison must not price those
  // as cash, or use the calculator's provisional points placeholder.
  const cash = basis?.kind === "percent" &&
    /^%\s+cashback(?:\s*\(|\s*$)/i.test(card.earnUnit?.trim() ?? "") &&
    !/\bpaid\s+as\b/i.test(card.earnUnit ?? "") &&
    (!card.loyaltyProgram || /\bcashback\b/i.test(card.loyaltyProgram));
  const published = cash ? null : publishedAEDPerUnit(card.loyaltyProgram);
  const caps = card.earnRates._caps;
  const capsPending = ["earnRates._caps", "earnRates._caps.monthly_max_aed", "earnRates._caps.per_category",
    "earnRates._caps.per_category.everythingElse", "earnRates._caps.per_category.everythingElse.monthly_aed",
    "earnRates._caps.min_monthly_spend_to_qualify_aed"].some(pending);
  const supportedCaps = cash || (caps?.monthly_max_aed == null && caps?.per_category?.everythingElse == null);
  const priced = cash ? 1 : published;
  let rewardIssue = cardRewardModelIssue(card, slug);
  let rate: number | null = null;
  if (rewardIssue) {
    // A typed base rate alone does not settle these cases.
  } else if (pending("earnRates") || pending("earnRates.everythingElse") || pending("earnUnit")) {
    rewardIssue = "The everyday earn rate needs confirmation.";
  } else if (capsPending) {
    rewardIssue = "The qualifying spend or reward cap needs confirmation.";
  } else if (!basis || typeof baseRate !== "number" || baseRate < 0) {
    rewardIssue = "No comparable everyday earn rate is published.";
  } else if (priced == null || (!cash && basis.kind === "percent")) {
    rewardIssue = "No confirmed AED basis for these rewards.";
  } else if (!supportedCaps) {
    rewardIssue = "The published cap cannot be modelled reliably in AED.";
  } else {
    rate = nativeEarned(1, baseRate, basis) * priced;
  }
  const publishedCaps = cash && !capsPending && rate != null
    ? [caps?.monthly_max_aed, caps?.per_category?.everythingElse?.monthly_aed]
      .filter((value): value is number => value != null)
    : [];
  const cap = publishedCaps.length ? Math.min(...publishedCaps) : null;

  const rawWaiver = card.annualFeeWaiver;
  const waiver = isStructuredAnnualFeeWaiver(rawWaiver) ? rawWaiver : null;
  const waiverPending = pending("annualFeeWaiver") || pending("annualFeeWaiver.year_one_waived");
  const assumesYearOneWaiver = waiver?.year_one_waived === true && !waiverPending;
  const feePending = pending("annualFee") || pending("annualFee.amount") ||
    (card.annualFee.amount === 0 && card._provenance.annualFee === "scraped");
  const joinPending = pending("joiningFee") || pending("joiningFee.amount");
  const joining = card.joiningFee?.amount;
  const standard = feeWithVAT(card.annualFee.amount, card.vatPolicy);
  let firstFee = feePending ? null : standard;
  let laterFee = feePending ? null : standard;
  let firstFeeIssue = feePending ? "Confirm the first-year fee with the issuer." : "";
  let laterFeeIssue = feePending ? "Confirm the standard renewal fee with the issuer." : "";

  // A zero recorded on a first-year promotion does not establish a free
  // renewal. Conversely, an explicit unconditional ongoing waiver does.
  if (standard === 0 && (waiverPending || (assumesYearOneWaiver && waiver?.ongoing_threshold_aed !== 0) ||
      (typeof rawWaiver === "string" && rawWaiver.trim()))) {
    laterFee = null;
    laterFeeIssue = "A zero first-year or promotional fee does not establish the standard renewal fee.";
  }
  if (joinPending) {
    firstFee = null;
    firstFeeIssue = "Confirm the joining fee with the issuer.";
  } else if (waiverPending) {
    firstFee = null;
    firstFeeIssue = "Confirm the first-year annual fee and waiver conditions with the issuer.";
  } else if (assumesYearOneWaiver) {
    firstFee = feeWithVAT(joining ?? 0, card.vatPolicy);
    firstFeeIssue = "";
  } else if (joining != null && joining > 0 && standard > 0) {
    firstFee = null;
    firstFeeIssue = "Confirm whether both joining and annual fees are due in year one.";
  } else if (!feePending && joining != null) {
    firstFee = feeWithVAT(joining, card.vatPolicy) + standard;
  }

  return {
    rate,
    minimum: capsPending ? null : caps?.min_monthly_spend_to_qualify_aed ?? null,
    cap,
    firstFee,
    laterFee,
    assumesYearOneWaiver,
    hasConditionalRenewalWaiver: !waiverPending && (waiver?.ongoing_threshold_aed ?? 0) > 0,
    annualWaiver: waiverPending ? "" : annualFeeWaiverDisplay(rawWaiver),
    rewardIssue,
    firstFeeIssue,
    laterFeeIssue,
    pointsBaseline: rate != null && !cash,
    hasWelcomeOffer: Boolean(card.welcomeBonus),
  };
}

export function calculateCardValue(terms: CardValueTerms, monthlySpend: number): CardValue {
  const valid = Number.isSafeInteger(monthlySpend) && monthlySpend >= 0 && monthlySpend <= MAX_CARD_VALUE_MONTHLY_SPEND;
  const below = terms.minimum != null && monthlySpend < terms.minimum;
  const raw = valid && !below && terms.rate != null ? monthlySpend * terms.rate : null;
  const monthlyReward = raw == null ? null : terms.cap == null ? raw : Math.min(raw, terms.cap);
  const roundFils = (aed: number) => Math.round(aed * 100) / 100;
  const rewards = monthlyReward == null ? null : roundFils(monthlyReward * 12);
  return {
    rewards,
    first: rewards == null || terms.firstFee == null ? null : roundFils(rewards - terms.firstFee),
    later: rewards == null || terms.laterFee == null ? null : roundFils(rewards - terms.laterFee),
    rewardIssue: !valid ? "Enter a valid whole-dirham monthly amount." : terms.rewardIssue ||
      (below ? "This spend is below the listed monthly qualifying minimum. Check what, if anything, still earns." : ""),
    capBinds: raw != null && terms.cap != null && raw > terms.cap,
  };
}

export const CARD_VALUE_NOT_ESTIMATED = "Not estimated";

export function formatCardValue(amount: number | null): string {
  if (amount == null) return CARD_VALUE_NOT_ESTIMATED;
  const rounded = Math.round(amount);
  return rounded === 0 ? formatAED(0) : formatAED(rounded);
}
