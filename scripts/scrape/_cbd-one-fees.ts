import { createHash } from "node:crypto";
import { parseSourceNumber } from "./_lib.ts";

// A named KFS, not the all-card tariff and not a product-page headline.
// Both the PDF and layout text are pinned to the reviewed revision.
const url = "https://www.cbd.ae/docs/default-source/document/cards/cbd-kfs-conventional_cbd-one-cc.pdf";
const bodySha256 = "2237dfc9faec1ca4bc8504edbc407bccf7edf4b83d54bb886a4e4c3afd4c94e8";
const textSha256 = "d1b8b024833df4b3686a07cb6bdccb674b160822d77d872a2be25c794d887ce5";
const capturedAt = "2026-11-16T17:58:21Z";
const pins = {
  product: [25, 27, 1735, "39c8c9f4f6ec31b991c0c44798ef19265dcdb6b850e9bbfea2e1055e3088e25b"],
  cash: [53, 54, 4102, "ac489da4d09330914e12ec084473f0e555544fa45d8d9143348b6afaf0f7be12"],
  foreign: [56, 57, 4362, "2971ce89241f3a9e67fd5d4ff7b9b54ed50878265cd3e3638a51b5b204ba2702"],
  dated: [62, 62, 4681, "8a53f679227177d2168ecab08e4da7938dab1a301ba5d7acb2fd305a58773b0a"],
  network: [74, 75, 5201, "fc88dc43464c7d9d4ae2a9a4fd280f7cf9abe74101967332499b0ee2427892ea"],
  vat: [147, 151, 10793, "8a5fd08dbc9342de16701cec16252d0869a4910338e962930fb54e21f4a59bff"],
} as const;
type Row = { firstLine: number; lastLine: number; sourceStartByte: number; sourceEndByte: number; text: string; sha256: string };
type Source = { url: string; capturedAt: string; bodySha256: string; textSha256: string; rows: Record<string, Row> };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export function parseCbdOneFees(source: Source) {
  if (source.url !== url || source.capturedAt !== capturedAt
    || source.bodySha256 !== bodySha256 || source.textSha256 !== textSha256) return null;
  const row = (key: keyof typeof pins) => source.rows[key]!;
  if (Object.entries(pins).some(([key, [first, last, start, sha]]) => {
    const r = source.rows[key];
    return !r || r.firstLine !== first || r.lastLine !== last || r.sourceStartByte !== start
      || r.sourceEndByte !== start + Buffer.byteLength(r.text)
      || r.text.split("\n").length !== last - first + 1 || r.sha256 !== sha || hash(r.text) !== sha;
  })) return null;
  if (!/^\s*Annual Fee\s+Free For Life\s+Free For Life\s+CBD ONE Visa Signature – One\s*$/m.test(row("product").text)
    || row("dated").text !== "Updated: 3 September 2026"
    || !/international\n\s*Transaction Fee \(or\)\s+transactions performed in AED and non-AED\. This Fee is in addition to/.test(row("foreign").text)
    || !/standard processing fee charged by Visa or alternative scheme on all\n\s*Conversion Fee\s+international AED & non-AED transactions\./.test(row("network").text)
    || !/are inclusive of Value Added Tax \(VAT\)/.test(row("vat").text)) return null;
  const fxFee = parseSourceNumber(row("foreign").text.match(/^\s*Foreign Currency\s+(\d+(?:\.\d+)?)%\s+IMPORTANT:/)?.[1]);
  const cash = parseSourceNumber(row("cash").text.match(/^\s*Cash Withdrawal Fee\s+AED (\d+(?:\.\d+)?)\s+IMPORTANT: Applicable on withdrawal of cash from the CARD through\n\s+any channel\.$/)?.[1]);
  if (fxFee === null || fxFee <= 0 || fxFee > 10 || cash === null || cash <= 0) return null;
  function evidence(key: keyof typeof pins, unit: string) {
    const r = row(key);
    return {
      parserId: "cbd/one-named-kfs-fees/v1",
      productScope: "CBD ONE Visa Signature – One; issuer fees only",
      unit, vatTreatment: "inclusive" as const,
      sourceUrl: url, capturedAt, sourceTextSha256: textSha256, sourceBodySha256: bodySha256,
      sourceRepresentation: "pdftotext-layout" as const, captureMethod: "public-http-reader" as const,
      firstLine: r.firstLine, lastLine: r.lastLine, sourceStartByte: r.sourceStartByte, sourceEndByte: r.sourceEndByte,
      rawText: r.text, rawTextSha256: r.sha256,
    };
  }
  return {
    fxFee, fxFeeScope: "issuer-fx-charges-only" as const, fxFeeVatTreatment: "inclusive" as const,
    cashAdvanceFee: `AED ${cash.toFixed(2)} per cash withdrawal`,
    evidence: {
      fxFee: [evidence("product", "named variant"), evidence("foreign", "percent of international transaction value"),
        evidence("network", "separate scheme charge clause"), evidence("vat", "issuer VAT treatment")],
      cashAdvanceFee: [evidence("product", "named variant"), evidence("cash", "AED per withdrawal"), evidence("vat", "issuer VAT treatment")],
    },
  };
}
