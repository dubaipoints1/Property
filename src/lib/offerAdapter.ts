import type { CollectionEntry } from "astro:content";
import { getCollection, getEntry } from "astro:content";
import type { SalaryTransferOffer } from "./salaryTransfer";

type OfferEntry =
  | CollectionEntry<"salaryTransferOffers">
  | CollectionEntry<"salaryTransferOfferHistory">;

export async function entryToOffer(entry: OfferEntry): Promise<SalaryTransferOffer> {
  const bank = await getEntry(entry.data.bank);
  return {
    id: entry.id,
    bankSlug: bank?.id ?? entry.data.bank.id,
    bankName: bank?.data.name ?? entry.data.bank.id,
    name: entry.data.name,
    validFrom: entry.data.validFrom.toISOString(),
    validUntil: entry.data.validUntil.toISOString(),
    tenureMonths: entry.data.tenureMonths,
    sharia: entry.data.sharia,
    creditCardRequired: entry.data.creditCardRequired,
    additionalProductsRequired: entry.data.additionalProductsRequired,
    salaryBands: entry.data.salaryBands.map((b) => ({
      minSalary: b.minSalary,
      maxSalary: b.maxSalary,
      rewardAmount: b.rewardAmount,
      rewardType: b.rewardType,
      voucherRetailer: b.voucherRetailer,
      monthsToPayout: b.monthsToPayout,
      components: b.components?.map((c) => ({
        label: c.label,
        amount: c.amount,
        requires: c.requires,
      })),
    })),
    requirements: entry.data.requirements,
    clawbackTerms: entry.data.clawbackTerms,
    sourceUrl: entry.data.sourceUrl,
    lastVerified: entry.data.lastVerified.toISOString(),
  };
}

export async function getLiveOffers(): Promise<SalaryTransferOffer[]> {
  const today = Date.now();
  const entries = await getCollection("salaryTransferOffers", (e) => {
    if (e.data.archived) return false;
    return e.data.validUntil.getTime() >= today;
  });
  return Promise.all(entries.map(entryToOffer));
}

export async function getOffersForBank(bankSlug: string): Promise<SalaryTransferOffer[]> {
  const entries = await getCollection("salaryTransferOffers", (e) => e.data.bank.id === bankSlug);
  return Promise.all(entries.map(entryToOffer));
}

export async function getHistoryForBank(bankSlug: string): Promise<SalaryTransferOffer[]> {
  const entries = await getCollection(
    "salaryTransferOfferHistory",
    (e) => e.data.bank.id === bankSlug,
  );
  return Promise.all(entries.map(entryToOffer));
}
