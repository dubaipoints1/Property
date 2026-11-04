import { getCardArt } from "./cardArt";
import type { SalaryTransferOffer } from "./salaryTransfer";

export interface TrackerCardExample {
  slug: string;
  name: string;
  issuer: string;
  src: string;
  width: number;
  height: number;
}

export interface TrackerCardPath {
  financeAlternative: boolean;
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
    if (offer.id !== "dib-xtra-2026" || offer.bankSlug !== "dib" ||
      offer.sourceUrl !== "https://www.dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf") continue;

    const path: TrackerCardPath = { financeAlternative: true };
    const slug = "dib-consumer-cashback";
    const art = getCardArt(slug);
    if (art?.page === "https://www.dib.ae/personal/cards/consumer-reward-card") {
      path.example = {
        slug,
        name: "DIB Consumer Reward Covered Card",
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
