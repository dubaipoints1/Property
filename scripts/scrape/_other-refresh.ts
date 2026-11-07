// Offline original-card refresh evidence. No fetch, file write, date promotion,
// protected-field approval or automatic merge. Bounds stay bounds.
import { createHash } from "node:crypto";
import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";
import type { PrimaryCardSource } from "./_bank-parsers.ts";

export type OtherRefreshSource = PrimaryCardSource & { sourceComplete: boolean; sourceStartByte: number };
export type OtherRefreshObservation = {
  field: string; value: number; parserId: string; productScope: string; unit: string;
  vatTreatment: "inclusive" | "exclusive" | "not-applicable";
  sourceUrl: string; capturedAt: string; sourceTextSha256: string; sourceBodySha256: string;
  sourceRepresentation: "http-decoded-response-body"; captureMethod: "public-http-reader";
  sourceStartByte: number; sourceEndByte: number; firstLine: number; lastLine: number;
  rawText: string; rawTextSha256: string;
};
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function valid(s: OtherRefreshSource, host: string, pathname: RegExp): boolean {
  try {
    const u = new URL(s.url);
    // Readable contiguous excerpts retain distinct full-source and fragment
    // identities. The private capture verifier binds their original offsets.
    return u.protocol === "https:" && u.hostname === host && !u.username && !u.password && pathname.test(u.pathname)
      && s.sourceComplete === true && Number.isInteger(s.firstLine) && s.firstLine > 0
      && Number.isSafeInteger(s.sourceStartByte) && s.sourceStartByte >= 0
      && sha(s.text) === s.fixtureTextSha256 && /^[a-f0-9]{64}$/.test(s.sourceTextSha256)
      && /^[a-f0-9]{64}$/.test(s.sourceBodySha256 ?? "")
      && (s.sourceRepresentation === undefined || s.sourceRepresentation === "http-decoded-response-body");
  } catch { return false; }
}
function one(text: string, pattern: RegExp): RegExpMatchArray | null {
  const all = [...text.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"))];
  return all.length === 1 ? all[0] : null;
}
function evidence(s: OtherRefreshSource, m: RegExpMatchArray, field: string, token: string, productScope: string,
  unit: string, vatTreatment: OtherRefreshObservation["vatTreatment"] = "not-applicable"): OtherRefreshObservation | null {
  const value = parseSourceNumber(token); if (value === null) return null;
  const firstLine = s.firstLine + s.text.slice(0, m.index!).split("\n").length - 1;
  return { field, value, productScope, unit, vatTreatment, parserId: "other-refresh/named-source-fields/v1",
    sourceUrl: s.url, capturedAt: s.capturedAt, sourceTextSha256: s.sourceTextSha256, sourceBodySha256: s.sourceBodySha256!,
    sourceRepresentation: "http-decoded-response-body", captureMethod: "public-http-reader",
    sourceStartByte: s.sourceStartByte + Buffer.byteLength(s.text.slice(0, m.index!)), sourceEndByte: s.sourceStartByte + Buffer.byteLength(s.text.slice(0, m.index! + m[0].length)),
    firstLine, lastLine: firstLine + m[0].split("\n").length - 1, rawText: m[0], rawTextSha256: sha(m[0]) };
}

/** Both documents explicitly say the revised rate applies from 1 October 2026.
 * The date guard prevents accidentally applying a future change early. */
export function parseCitiCashbackRefresh(s: OtherRefreshSource, reviewedOn: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn) || reviewedOn < "2026-10-01"
    || !valid(s, "www.citibank.ae", /^\/content\/dam\/cgcpc\/ae\/prelogin\/www-citibank-ae\/doc\/pdf\/kfs-cards\.pdf$/)
    || !/KEY BENEFITS & FEATURES/.test(s.text)) return null;
  const effective = one(s.text, /^ +Citi Simplicity\. \*\*\*Revised Annual percentage rate[\s\S]*?^ +to remain at 39%\.$/gm);
  if (!effective || !/effective\s+01 Oct 2026/.test(effective[0])) return null;
  const row = one(s.text, new RegExp(`^ +Citi Cash Back +AED (${SOURCE_NUMBER}) +(${SOURCE_NUMBER})% +(${SOURCE_NUMBER})%$`, "gm"));
  const age = one(s.text, /^ +• UAE national or resident, aged between (\d+) and (\d+) years at the date of application$/gm);
  if (!row || !age) return null;
  const observations = [evidence(s, row, "interestRate.monthly", row[2], "Citi Cash Back", "percent per month"),
    evidence(s, row, "interestRate.annual", row[3], "Citi Cash Back", "percent APR"),
    evidence(s, age, "eligibility.minAge", age[1], "Citi Cash Back", "years"),
    evidence(s, age, "eligibility.maxAge", age[2], "Citi Cash Back", "years")];
  if (observations.some(e => e === null)) return null;
  return { slug: "citi-cashback", interestRate: { monthly: observations[0]!.value, annual: observations[1]!.value },
    minAge: observations[2]!.value, maxAge: observations[3]!.value, observations: observations as OtherRefreshObservation[],
    effectiveContext: effective[0], state: "candidate-requiring-independent-review" as const };
}

const FAB = { "fab-cashback": "FAB Cashback", "fab-elite": "FAB Elite", "fab-etihad-guest-infinite": "Etihad Guest Infinite", "fab-world-elite": null } as const;
export function parseFabExistingCurrentFees(kfs: OtherRefreshSource, sof: OtherRefreshSource, slug: string) {
  if (!Object.hasOwn(FAB, slug) || !valid(kfs, "www.bankfab.com", /^\/-\/media\/fab-uds\/personal\/key-facts-statements\/credit-cards\/fab-consolidated-credit-cards-en\.pdf$/)
    || !valid(sof, "www.bankfab.com", /^\/-\/media\/fab-uds\/personal\/credit-cards\/fees-and-charges\/credit-card\.pdf$/)
    || !/September 2026 - Version 3\.0 - English/.test(kfs.text) || !/Fees and Charges Inclusive of VAT/.test(kfs.text)
    || !/Annual Membership Fee \(AMF\) Inclusive of VAT/.test(sof.text) || !/Primary Card +Supplementary Card/.test(sof.text)) return null;
  const fx = one(kfs.text, new RegExp(`^ +International Transaction Fee\\* +Up to (${SOURCE_NUMBER})% \\+ scheme charges\\*, including FX margin and fees$`, "gm"));
  if (!fx) return null;
  const fxObservation = evidence(kfs, fx, "fxFeeUpperBound.amount", fx[1], slug, "percent issuer foreign-currency upper bound", "inclusive");
  if (!fxObservation) return null;
  const name = FAB[slug as keyof typeof FAB];
  const observations = [fxObservation]; let annualFee: number | null = null;
  if (name) {
    const fee = one(sof.text, new RegExp(`^ +${escape(name)} +(${SOURCE_NUMBER}) +(?:Free|${SOURCE_NUMBER})$`, "gm"));
    if (!fee) return null;
    const feeObservation = evidence(sof, fee, "annualFee.amount", fee[1], slug, "AED primary annual fee", "inclusive");
    if (!feeObservation) return null;
    annualFee = feeObservation.value; observations.push(feeObservation);
  }
  return { slug, annualFee, fxFee: null, fxFeeUpperBound: { amount: fxObservation.value, unit: "percent" as const,
    vatTreatment: "inclusive" as const, scope: "issuer-fx-charges" as const, schemeCharges: "additional" as const }, observations,
    pending: name ? [] : ["The current tariff does not establish the legacy World Elite fee; do not alias World Elite Select or the generic not-on-sale row."],
    state: "candidate-requiring-independent-review" as const };
}

export function parseScPlatinumXCurrentTerms(product: OtherRefreshSource, guide: OtherRefreshSource) {
  if (!valid(product, "www.sc.com", /^\/ae\/credit-cards\/platinum-x-cashback\/$/) || !/^# Platinum X – Standard Chartered UAE/m.test(product.text)
    || !valid(guide, "av.sc.com", /^\/ae\/content\/docs\/ae-sp-price-guide-conventional-english-v3\.pdf$/)
    || !/All fees and charges listed are inclusive of 5% Value Added Tax/.test(guide.text)
    || !/This fee is charged in addition to the standard processing fee charged by Mastercard or Visa/.test(guide.text)) return null;
  const observations: OtherRefreshObservation[] = []; const channels: Record<string, Array<{ minimumSpendAED: number; maximumSpendAED: number | null; percent: number; monthlyCashCapAED: number }>> = {};
  for (const channel of ["online", "foreign currency", "mobile wallet"]) {
    const heading = channel === "online" ? "MAXIMUM CASHBACK PER MONTH ON ONLINE SPENDS" : "Maximum cashback per month ON " + channel.toUpperCase() + " SPENDS";
    const block = one(product.text, new RegExp(`^Total Spends \\(AED\\)\\nCashback percentage on ${channel} spend\\n${heading} \\(AED\\)\\n\\n((?:[^\\n]*\\n){18}[^\\n]*)`, "gm"));
    if (!block) return null;
    const rows = [...block[1].matchAll(new RegExp(`^(${SOURCE_NUMBER})(?: – (${SOURCE_NUMBER})| and above)\\n(${SOURCE_NUMBER})%\\n(${SOURCE_NUMBER})(?=\\n|$)`, "gm"))];
    if (rows.length !== 4) return null;
    channels[channel] = [];
    for (const [index, row] of rows.entries()) {
      const start = block.index! + block[0].indexOf(block[1]) + row.index!; row.index = start;
      const keys = ["minimumSpendAED", "maximumSpendAED", "percent", "monthlyCashCapAED"];
      const parsed: Array<number | null> = [];
      for (const [n, token] of row.slice(1).entries()) {
        if (n === 1 && token === undefined) { parsed.push(null); continue; }
        const e = evidence(product, row, `rewardTiers.${channel}.${index}.${keys[n]}`, token, "Standard Chartered Platinum X", n >= 2 ? n === 2 ? "percent cashback" : "AED monthly channel cashback cap" : "AED overall monthly spend");
        if (!e) return null; observations.push(e); parsed.push(e.value);
      }
      channels[channel].push({ minimumSpendAED: parsed[0]!, maximumSpendAED: parsed[1], percent: parsed[2]!, monthlyCashCapAED: parsed[3]! });
    }
  }
  const fx = one(guide.text, new RegExp(`^ +Up to (${SOURCE_NUMBER})% of the\\n +Foreign Transaction Charge2\\n +transaction amount$`, "gm"));
  if (!fx) return null;
  const fxObservation = evidence(guide, fx, "fxFeeUpperBound.amount", fx[1], "Standard Chartered Platinum X", "percent issuer foreign-transaction upper bound", "inclusive");
  if (!fxObservation) return null; observations.push(fxObservation);
  return { slug: "sc-platinum-x", channels, fxFee: null, fxFeeUpperBound: { amount: fxObservation.value, unit: "percent" as const,
    vatTreatment: "inclusive" as const, scope: "issuer-fx-charges" as const, schemeCharges: "additional" as const }, observations,
    pending: ["The scalar headline rates are not an unrestricted reward model. Preserve spend tiers, per-channel caps and possible channel overlap."],
    state: "candidate-requiring-independent-review" as const };
}

export function parseWioReducedCurrentRewards(kfs: OtherRefreshSource) {
  if (!valid(kfs, "assets.ctfassets.net", /^\/l65m9bcr2nac\/6YdOzuMWXOLOGLsbL9YYG\/e8d5c70a361d636d530db6d1790e0d85\/wio-personal-credit-KFS-version-5_Eng_-august-2026\.pdf$/)
    || !kfs.text.startsWith("Wio Personal Credit Key Fact Statement\n(Effective August 2026)")
    || !/Cashback is not applicable to Standard Plan customers\./.test(kfs.text)) return null;
  const reduced = one(kfs.text, new RegExp(`^ +o (${SOURCE_NUMBER})% for payments to any government entities, Real Estate transactions \\(including\\n +but not limited to Off-Plan instalments\\), utility bills e\\.g\\. DEWA, DU transactions\\n +\\(including Easy Cash\\)\\.$`, "gm"));
  if (!reduced) return null;
  const observations = ["government", "realEstate", "utilities"].map(category => evidence(kfs, reduced, "earnRates." + category, reduced[1], "Wio Credit", "percent cashback"));
  if (observations.some(e => !e)) return null;
  return { slug: "wio-credit", reducedCategories: Object.fromEntries(observations.map(e => [e!.field.replace("earnRates.", ""), e!.value])),
    observations: observations as OtherRefreshObservation[],
    pending: ["DU is named in this clause; this does not prove a universal all-telecom rate.", "Cashback is plan-dependent and the combined Credit/MyMoney cap applies; no unrestricted total return."],
    state: "candidate-requiring-independent-review" as const };
}
