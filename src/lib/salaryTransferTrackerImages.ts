import { getCardArt } from "./cardArt";
import type { SalaryTransferOffer } from "./salaryTransfer";
import { getSalaryOfferRules } from "./salaryTransferRules";

export interface TrackerCardExample {
  slug: string;
  name: string;
  issuer: string;
  src: string;
  width: number;
  height: number;
}

export interface TrackerCardPath {
  financeAlternative?: true;
  accountRewardComponent?: string;
  example?: TrackerCardExample;
}

// Match the exact product and campaign, not just the bank. The Consumer
// Reward Covered Card is one of several options in DIB XTRA §2.1:
// https://www.dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf
// It is not required if a reader qualifies through a finance facility.
// Other current campaigns do not establish a specific imageable credit
// card for the offer row; use the issuer mark rather than guessing.
export function getTrackerCardPaths(
  offers: readonly Pick<SalaryTransferOffer, "id" | "bankSlug" | "sourceUrl">[],
): Record<string, TrackerCardPath> {
  const paths: Record<string, TrackerCardPath> = {};
  for (const offer of offers) {
    const rule = getSalaryOfferRules(offer);
    if (rule?.accountRewardComponent) {
      paths[offer.id] = { accountRewardComponent: rule.accountRewardComponent };
      continue;
    }
    if (!rule?.financeAlternative) continue;

    const path: TrackerCardPath = { financeAlternative: true };
    const slug = "dib-consumer-cashback";
    const art = getCardArt(slug);
    if (art?.page === "https://www.dib.ae/personal/cards/consumer-reward-card") {
      path.example = {
        slug,
        name: "DIB Consumer Cashback Reward Covered Card",
        issuer: "Dubai Islamic Bank",
        src: `/${art.file}`,
        width: art.width,
        height: art.height,
      };
    }
    paths[offer.id] = path;
  }
  return paths;
}
