import type { SalaryBand, SalaryTransferOffer } from "./salaryTransfer";

type Campaign = Pick<SalaryTransferOffer, "id" | "bankSlug" | "sourceUrl" | "comparisonNote">;

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
  "adib-arrive-2026": {
    bank: "adib",
    source: "https://www.adib.ae/-/media/project/adib/adibsite/docs/personal/new-to-country/adib-arrive-terms-and-conditions.pdf",
    needsConfirmation: "Confirm your new-to-ADIB and recent-arrival status, approved Arrive enrolment and qualifying payroll with ADIB.",
    commitmentNote: "Three qualifying salaries",
  },
  "mashreq-al-islami-neo-2026": {
    bank: "mashreq",
    source: "https://www.mashreqalislami.com/-/jssmedia/pdfs/mai/neo/kfs-tnc/Early-Bird-TNCS.ashx",
    needsConfirmation: "Confirm the first-account and 90-day payroll conditions with Mashreq. The published Islamic route is not an extra reward on top of conventional NEO.",
    commitmentNote: "Twelve monthly instalments",
  },
  "fab-islamic-amana-2026": {
    bank: "fab",
    source: "https://www.bankfab.com/-/media/fab-uds/islamic-banking/promotions/2026/20-percent-salary-transfer-cashback/fab-islamic-terms-and-conditions-20-percent-salary-transfer-campaign-en.pdf?view=1",
    needsConfirmation: "You need a new qualifying FAB Islamic credit card and sufficient eligible spend every month. This tool cannot confirm either.",
    trackerExamples: true,
    commitmentNote: "Up to twelve qualifying months",
  },
  "hsbc-new-to-bank-2026-sep-dec": {
    bank: "hsbc",
    source: "https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/new-to-bank-and-customer-relationship-offer-terms-and-conditions.pdf",
    confirmHighestTier: "The Premier reward also requires qualifying Global Money transactions. This calculator does not verify that activity.",
  },
  "hsbc-premier-existing-2026": {
    bank: "hsbc",
    source: "https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/premier-existing-to-bank-customers-salary-transfer-offer-tscs.pdf",
    needsConfirmation: "Existing HSBC UAE Premier account opened before August 2024 only. Check its status and payroll history.",
    restrictedCohort: "Existing Premier account opened before August 2024 only",
    earlyExitNote: "Closing the account or stopping payroll within 180 days of your first salary may cost you the reward.",
    commitmentNote: "180-day retention rule",
  },
  "rakbank-nov-2026": {
    bank: "rakbank",
    source: "https://www.rakbank.ae/globalassets/rakbank/all-pdfs/001---campaign/salary-transfer-cash-reward-promotion-terms-and-conditions-nov-2026.pdf",
    compareBaseReward: true,
    commitmentNote: "Three qualifying salaries",
  },
  "standard-chartered-priority-2026-nov-2027-jan": {
    bank: "standard-chartered",
    source: "https://av.sc.com/ae/content/docs/sc-ae-wsdepositscampaign.pdf",
    needsConfirmation: "Confirm your Priority or Priority Private relationship, new/existing customer status and qualifying payroll dates with Standard Chartered.",
  },
  "mashreq-2026": {
    bank: "mashreq",
    source: "https://www.mashreq.com/-/jssmedia/pdfs/neo/accounts-deposits/TnCs/2026/neo-salary-bonus-tnc-en-ar.ashx",
    compareBaseReward: true,
    shortStayConfirmation: "The full joining bonus takes 12 instalments. Confirm how an early switch affects the bonus; two consecutive missed salaries during the bonus period trigger recovery.",
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
  restrictedCohort?: string;
  compareBaseReward?: true;
  commitmentNote?: string;
  shortStayConfirmation?: string;
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

type ComparisonBand = Pick<SalaryBand, "rewardAmount" | "components">;

function baseComparisonReward(offer: Campaign, reward: ComparisonBand): number {
  return getSalaryOfferRules(offer)?.compareBaseReward && reward.components?.length
    ? reward.components.reduce((sum, component) => sum + (component.requires ? 0 : component.amount), 0)
    : reward.rewardAmount;
}

export function salaryOfferComparisonNote(offer: Campaign, reward: ComparisonBand): string | undefined {
  if (offer.comparisonNote) return offer.comparisonNote;
  const cohort = getSalaryOfferRules(offer)?.restrictedCohort;
  if (cohort) return cohort;
  const base = baseComparisonReward(offer, reward);
  if (base === reward.rewardAmount) return undefined;
  if (base === 0) return reward.components?.find((component) => component.requires)?.requires;
  return "Includes an early-bird extra · value comparison uses the joining bonus";
}

export function salaryOfferLowerBandQualification(offer: Campaign): string | undefined {
  return offer.id === "rakbank-nov-2026" && getSalaryOfferRules(offer)
    ? "AED 5,000–9,999: restricted payroll tier"
    : undefined;
}

/** Keep held, illustrative and restricted offers out of the general value order. */
export function compareSalaryOffersByReward(
  a: { offer: Campaign; reward: ComparisonBand },
  b: { offer: Campaign; reward: ComparisonBand },
): number {
  const priority = ({ offer, reward }: typeof a) => {
    if (salaryOfferSourceNote(offer)) return 3;
    if (offer.comparisonNote) return 2;
    const rule = getSalaryOfferRules(offer);
    if (rule?.trackerExamples) return 2;
    if (rule?.restrictedCohort || baseComparisonReward(offer, reward) === 0) return 1;
    return 0;
  };
  const aPriority = priority(a);
  const bPriority = priority(b);
  if (aPriority || bPriority) return aPriority - bPriority;
  return baseComparisonReward(b.offer, b.reward) - baseComparisonReward(a.offer, a.reward);
}
