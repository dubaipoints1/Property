// Related cards for a programme hub — shared by /airlines/[slug]/ and
// /hotels/[slug]/ so the two routes cannot drift apart.

import { getEntry } from "astro:content";
import { getActiveCards } from "~/lib/cardsData";
import { compareByWelcomeValue } from "~/lib/cardsDataFormat";

export interface ProgrammeRelatedCard {
  slug: string;
  name: string;
  bankName: string;
  annualFeeAed: number;
}

// Match a card's loyaltyProgram string to this programme. Loose match:
// strip the trailing "Miles"/"Points" suffix on both sides and compare.
// Handles "Etihad Guest" vs "Etihad Guest Miles", "Marriott Bonvoy"
// vs "Marriott Bonvoy Points", etc.
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+(miles|points)\b/g, "")
    .trim();
}

export async function relatedCardsForProgramme(
  programmeName: string,
  currencyName: string,
): Promise<ProgrammeRelatedCard[]> {
  const programmeNeedle = normalise(programmeName);
  const currencyNeedle = normalise(currencyName);

  const relatedRaw = getActiveCards().filter((c) => {
    const lp = c.loyaltyProgram;
    if (!lp || lp === "scraped" || lp === "editor-confirmed") return false;
    const card = normalise(lp);
    return card === programmeNeedle || card === currencyNeedle;
  });

  return Promise.all(
    relatedRaw
      .sort(compareByWelcomeValue)
      .slice(0, 8)
      .map(async (c) => {
        const bank = await getEntry("banks", c.bank);
        return {
          slug: c.slug,
          name: c.name,
          bankName: bank?.data.name ?? c.bank,
          annualFeeAed: c.annualFee.amount,
        };
      }),
  );
}
