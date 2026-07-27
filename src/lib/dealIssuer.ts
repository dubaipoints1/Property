// Deal issuer resolution.
//
// A deal is attributed to exactly one issuer: a UAE bank (card offers)
// or a loyalty programme (airline/hotel offers — added 2026-07-27 so the
// Travel nav's "Airline deals" row has somewhere real to point). The
// schema enforces the exclusivity; this resolves whichever is set into
// the display name and hub link the deal pages need, so neither page
// carries the branch.

import { getEntry, type CollectionEntry } from "astro:content";

export interface DealIssuer {
  /** Display name, e.g. "Emirates NBD" or "Etihad Guest". */
  name: string;
  /** Hub page for the issuer, or null when it has no hub. */
  href: string | null;
  kind: "bank" | "program";
}

export async function resolveDealIssuer(
  deal: CollectionEntry<"deals">,
): Promise<DealIssuer> {
  const { bank, program } = deal.data;

  if (bank) {
    const entry = await getEntry(bank);
    return {
      name: entry?.data.name ?? bank.id,
      href: `/banks/${bank.id}/`,
      kind: "bank",
    };
  }

  if (program) {
    const entry = await getEntry(program);
    return {
      name: entry?.data.name ?? program.id,
      // Programme hubs live under /airlines/ — including the hotel
      // programmes (honest-but-odd URL namespace flagged in the
      // 2026-07-27 routing analysis; a redirect is queued, not shipped).
      href: `/airlines/${program.id}/`,
      kind: "program",
    };
  }

  // Unreachable while the schema refinement holds; kept so a future
  // schema loosening degrades to a label instead of a crash.
  return { name: "UAE issuer", href: null, kind: "bank" };
}
