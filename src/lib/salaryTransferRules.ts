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
  },
  "hsbc-new-to-bank-2026-sep-dec": {
    bank: "hsbc",
    source: "https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/offers/new-to-bank-and-customer-relationship-offer-terms-and-conditions.pdf",
    confirmHighestTier: "The Premier reward also requires qualifying Global Money transactions. This calculator does not verify that activity.",
  },
} as const;

export interface SalaryOfferRules {
  accountRewardComponent?: string;
  financeAlternative?: true;
  needsConfirmation?: string;
  confirmHighestTier?: string;
}

export const hasSalaryOfferRule = (id: string) => Object.hasOwn(rules, id);

export function getSalaryOfferRules(offer: Campaign): SalaryOfferRules | undefined {
  const rule = hasSalaryOfferRule(offer.id) ? rules[offer.id as keyof typeof rules] : undefined;
  return rule && offer.bankSlug === rule.bank && offer.sourceUrl === rule.source
    ? rule as SalaryOfferRules
    : undefined;
}
