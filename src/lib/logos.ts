// Which file renders a bank's mark, and whether it needs a dark plate.
// One list for BankLogo.astro and the deal tiles, so the two never
// disagree about a bank (they did, briefly, on 22 Oct 2026).
//
// PNG: the issuer's own site or Commons offers PNG only.
// WHITE: the issuer publishes its mark only in white (for a dark header).
// It is shown unmodified on a navy plate rather than recoloured, per the
// 2026-10-20 amendment's no-alteration rule.

const PNG = new Set<string>(["emirates-nbd", "rakbank", "emirates-islamic", "mashreq"]);
const WHITE: Record<string, string> = {
  dib: "dib-white.png",
  "al-hilal": "al-hilal-white.svg",
};

export interface BankMark {
  src: string;
  /** True when the mark is white-only and must sit on a dark plate. */
  plated: boolean;
}

export function bankMark(slug: string): BankMark {
  const white = WHITE[slug];
  if (white) return { src: `/logos/banks/${white}`, plated: true };
  return { src: `/logos/banks/${slug}.${PNG.has(slug) ? "png" : "svg"}`, plated: false };
}

/** A partner logo file named `<name>-white.<ext>` is white-only. */
export function isWhiteLogo(file: string): boolean {
  return /-white\.(svg|png|webp)$/.test(file);
}
