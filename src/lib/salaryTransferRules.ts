import type { SalaryTransferOffer } from "./salaryTransfer";

type Campaign = Pick<SalaryTransferOffer, "id" | "bankSlug" | "sourceUrl">;

const rules = {
  "emirates-islamic-2026-oct-2027-mar": {
    bank: "emirates-islamic",
    source: "https://www.emiratesislamic.ae/en/terms-and-conditions/salary-transfer-offer-terms-and-conditions-oct-2026",
    accountRewardComponent: "CASA salary cashback (non-UAE nationals)",
  },
  "dib-xtra-2026": {
    bank: "dib",
    source: "https://www.dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf",
    financeAlternative: true,
  },
  "fab-20-percent-2026": {
    bank: "fab",
    source: "https://www.bankfab.com/-/media/fab-uds/personal/promotions/2026/20-percent-cashback-on-salary-transfers/terms-and-conditions-en.pdf",
    needsConfirmation: "Requires qualifying savings or new-card spend each month. This calculator does not verify either route.",
    trackerExamples: true,
    earlyExitNote: "A missed qualifying month is not paid later. Closing before payment forfeits unpaid cashback.",
  },
  "hsbc-new-to-bank-2026-sep-dec": {
    bank: "hsbc",
    source: "https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/new-to-bank-and-customer-relationship-offer-terms-and-conditions.pdf",
    confirmHighestTier: "The Premier reward also requires qualifying Global Money transactions. This calculator does not verify that activity.",
  },
  "standard-chartered-priority-2026-nov-2027-jan": {
    bank: "standard-chartered",
    source: "https://av.sc.com/ae/content/docs/sc-ae-wsdepositscampaign.pdf",
    needsConfirmation: "Confirm your Priority or Priority Private relationship, new/existing customer status and qualifying payroll dates with Standard Chartered.",
  },
  "mashreq-2026": {
    bank: "mashreq",
    source: "https://www.mashreq.com/en/uae/neo/accounts/current-accounts/salary-transfer/",
    needsConfirmation: "Mashreq’s current offer page and linked bonus terms differ. Confirm which cashback amount and instalment schedule apply to your account.",
    trackerNote: "Offer-page amount; linked terms differ",
  },
} as const;

export interface SalaryOfferRules {
  accountRewardComponent?: string;
  financeAlternative?: true;
  needsConfirmation?: string;
  confirmHighestTier?: string;
  trackerNote?: string;
  trackerExamples?: true;
  earlyExitNote?: string;
}

export const hasSalaryOfferRule = (id: string) => Object.hasOwn(rules, id);

export function getSalaryOfferRules(offer: Campaign): SalaryOfferRules | undefined {
  const rule = hasSalaryOfferRule(offer.id) ? rules[offer.id as keyof typeof rules] : undefined;
  return rule && offer.bankSlug === rule.bank && offer.sourceUrl === rule.source
    ? rule as SalaryOfferRules
    : undefined;
}

// A live campaign can still have conflicting published evidence. Compact
// placements must not promote its amount without the source caveat.
export function salaryOfferSourceNote(offer: Campaign): string | undefined {
  const rule = getSalaryOfferRules(offer);
  return rule?.trackerNote ?? (!rule && hasSalaryOfferRule(offer.id) ? "Campaign source changed; check bank terms" : undefined);
}

/** A held advertised figure is visible with context, but not value ranked. */
export function compareSalaryOffersByReward(
  a: { offer: Campaign; reward: { rewardAmount: number } },
  b: { offer: Campaign; reward: { rewardAmount: number } },
): number {
  const aHeld = Boolean(salaryOfferSourceNote(a.offer));
  const bHeld = Boolean(salaryOfferSourceNote(b.offer));
  if (aHeld || bHeld) return Number(aHeld) - Number(bHeld);
  const aExample = Boolean(getSalaryOfferRules(a.offer)?.trackerExamples);
  const bExample = Boolean(getSalaryOfferRules(b.offer)?.trackerExamples);
  if (aExample || bExample) return Number(aExample) - Number(bExample);
  return b.reward.rewardAmount - a.reward.rewardAmount;
}
