// Offline Emirates NBD source review only. No network, source-date update or
// canonical write. A parsed value is evidence, not permission to overwrite an
// editor-protected field. VAT must be reconciled against the issuer fee guide.
import { parseSourceNumber } from "./_lib.ts";

export interface EnbdSourceSpan {
  start: number;
  end: number;
  firstLine: number;
  lastLine: number;
  rawText: string;
}
export interface EnbdParsedNumber {
  value: number;
  token: string;
  span: EnbdSourceSpan;
}
type Hold = { status: "hold"; reason: string };

function span(text: string, start: number, rawText: string): EnbdSourceSpan {
  const firstLine = text.slice(0, start).split("\n").length;
  return { start, end: start + rawText.length, firstLine,
    lastLine: firstLine + rawText.split("\n").length - 1, rawText };
}

/** Read a caller-supplied exact contextual regex inside one named product
 * section. It never searches navigation, related-card/footer content or a
 * combined multi-product corpus. Repeated identical numeric tokens are fine;
 * conflicting duplicates are a hold, never first-match-wins. Offsets use JS
 * string indices; archive writers must explicitly convert these to bytes. */
export function parseEnbdProductNumber(
  text: string,
  heading: string,
  contextualPattern: RegExp,
  group = 1,
): { status: "parsed"; values: EnbdParsedNumber[] } | Hold {
  const lines = text.split("\n");
  const heads = lines.map((line, i) => line === `# ${heading}` ? i : -1).filter(i => i >= 0);
  if (heads.length !== 1) return { status: "hold", reason: "Named product heading missing or ambiguous" };
  const start = lines.slice(0, heads[0]).join("\n").length + (heads[0] > 0 ? 1 : 0);
  const remaining = text.slice(start);
  const stops = ["#### Important links", "#### Other credit cards", "Thank you for your feedback!"]
    .map(label => remaining.indexOf(label)).filter(i => i >= 0);
  const section = remaining.slice(0, stops.length ? Math.min(...stops) : undefined);
  const flags = [...new Set((contextualPattern.flags.replace(/[gy]/g, "") + "g").split(""))].join("");
  const matches = [...section.matchAll(new RegExp(contextualPattern.source, flags))];
  if (!matches.length) return { status: "hold", reason: "Contextual numeric row absent" };
  const values: EnbdParsedNumber[] = [];
  for (const match of matches) {
    const token = match[group];
    const value = token === undefined ? null : parseSourceNumber(token);
    if (value === null) return { status: "hold", reason: "Invalid numeric token" };
    values.push({ value, token, span: span(text, start + match.index!, match[0]) });
  }
  if (new Set(values.map(v => v.value)).size !== 1)
    return { status: "hold", reason: "Conflicting duplicate numeric rows" };
  return { status: "parsed", values };
}

// Exact ordered headers from the English first page of the observed 08/2026
// issuer KFS. An order/name change invalidates positional mapping. Generic
// Titanium/Platinum do not prove the Diners/Mastercard-specific tier.
const HEADERS = [
  "Skywards Infinite SHARE Private SHARE Infinite UBE Infinite Darna Infinite Privilege Darna Infinite Marriott Bonvoy World Elite Marriott Bonvoy World Infinite",
  "Priority Banking Infinite Voyager World Elite Voyager World Etihad Guest Limitless/Elevate dnata World Skywards Signature SHARE Signature Etihad Guest Inspire Darna Signature",
  "UBE Signature Visa Flexi Lulu 247 Platinum Darna Select Lulu 247 Titanium noon One Duo dnata Platinum Platinum Go4it Platinum Go4it Gold SHARE Platinum",
  "UBE Family Titanium Man United Business Rewards Business Card Webshopper Chairman Card",
];
const SLOTS: Array<Array<string | null>> = [
  ["skywards-infinite", null, "share-visa-infinite", "u-by-emaar-infinite", null, "darna-visa-infinite", "marriott-bonvoy-world-elite", "marriott-bonvoy-world", "visa-infinite"],
  ["priority-banking-visa-infinite", null, "voyager-world", "etihad-guest-elevate", "dnata-world", "skywards-signature", "share-visa-signature", "etihad-guest-inspire", "darna-visa-signature"],
  [null, "visa-flexi", "lulu-247-platinum", "darna-select-visa", "lulu-247-titanium", "noon-one", "duo", "dnata-platinum", "visa-platinum", "go4it-platinum", "go4it-gold", null],
  ["u-by-emaar-family", null, "manchester-united", null, null, "webshopper", null],
];
const normalHeader = (s: string) => s.trim().replace(/^(Joining|Renewal)\s+/, "").replace(/\s+/g, " ");
export interface EnbdKfsFee {
  slug: string;
  field: "joiningFee" | "annualFee";
  amount: number;
  currency: "AED";
  // Explicit Free is converted deterministically to zero. No missing token
  // or ambiguous column ever becomes zero.
  sourceToken: string;
  column: number;
  span: EnbdSourceSpan;
}

export function parseEnbdKfsFees(text: string): { status: "parsed"; fees: EnbdKfsFee[] } | Hold {
  const version = text.indexOf("08/2026");
  if (version < 0 || !text.slice(0, version).includes("Key Facts Statement"))
    return { status: "hold", reason: "Unsupported or missing KFS version/header" };
  const firstPage = text.slice(0, version);
  const blocks = [...firstPage.matchAll(/(?<header>[^\n]*(?:Skywards Infinite|Priority Banking Infinite|UBE Signature|UBE Family)[^\n]*)\n(?<values>[^\n]+)/g)];
  if (blocks.length !== 8) return { status: "hold", reason: "Unexpected KFS fee block count" };
  const fees: EnbdKfsFee[] = [];
  for (const [i, block] of blocks.entries()) {
    if (normalHeader(block.groups!.header) !== HEADERS[i % 4])
      return { status: "hold", reason: "KFS named columns changed or reordered" };
    const tokens = block.groups!.values.trim().replace(/^Fee \(AED\)\s+/, "").split(/\s+/);
    if (tokens.length !== SLOTS[i % 4].length)
      return { status: "hold", reason: "KFS value count does not match named columns" };
    for (const [column, token] of tokens.entries()) {
      const amount = token === "Free" ? 0 : parseSourceNumber(token);
      if (amount === null) return { status: "hold", reason: "Invalid KFS fee token" };
      const suffix = SLOTS[i % 4][column];
      if (suffix) fees.push({ slug: `emirates-nbd-${suffix}`,
        field: i < 4 ? "joiningFee" : "annualFee", amount, currency: "AED",
        sourceToken: token, column, span: span(text, block.index!, block[0]) });
    }
  }
  return { status: "parsed", fees };
}
