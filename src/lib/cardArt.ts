// Issuer card art (9 Oct 2026). data/card-art/manifest.json is written by
// scripts/images/fetch-card-art.mjs in Actions; every entry is an image
// taken from the issuer's own website, with its source recorded. A card
// with no entry renders the typographic card face instead — never a
// substitute picture.
import manifest from "../../data/card-art/manifest.json";

export type CardArt = {
  file: string;
  width: number;
  height: number;
  url: string;
  page: string | null;
  alt: string | null;
  fetchedAt: string;
};

const entries = manifest as Record<string, CardArt>;

export function getCardArt(slug: string): CardArt | undefined {
  const e = entries[slug];
  return e && e.file && e.width && e.height ? e : undefined;
}
