// Bounded editorial hold proposal; stdout only. No numeric overwrite, fetch,
// automatic acceptance, monitor enrolment or date-refresh side effect.
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { parseMashreqCashbackBaseConflict, parseMashreqCreditLimitCondition } from "./_mashreq-primary.ts";
import type { PrimaryCardSource } from "./_bank-parsers.ts";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function parseMashreqCashbackHold(before: Record<string, unknown>, product: PrimaryCardSource, kfs: PrimaryCardSource, reviewedOn: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn) || before.name !== "Mashreq Cashback Credit Card") throw new Error("Unexpected review/product");
  const condition = parseMashreqCreditLimitCondition(product), conflict = parseMashreqCashbackBaseConflict(product, kfs);
  if (!condition || !conflict) throw new Error("Required cap/bound evidence did not parse uniquely");
  const current = structuredClone(before);
  const provenance = current._provenance as Record<string, string>;
  provenance["earnRates._caps"] = "needs-review";
  provenance["earnRates.everythingElse"] = "needs-review";
  const capEvidence = { ...condition, sourceBodySha256: condition.sourceBodySha256!, productScope: "Mashreq Cashback Credit Card", unit: "textual assigned-credit-limit restriction", vatTreatment: "not-applicable", sourceRepresentation: "http-decoded-response-body", captureMethod: "public-http-reader" };
  current._fieldEvidence = { ...(current._fieldEvidence as object ?? {}), "earnRates._caps": [capEvidence], "earnRates.everythingElse": [conflict.productClaim, conflict.kfsClaim] };
  current._dataIssues = { ...(current._dataIssues as object ?? {}), earnRates: "Cashback-eligible spend in each statement cycle is limited by the assigned credit-card limit; that customer-specific limit is not a published numeric cap. The product page describes other local spend as an upper bound while the KFS states an exact other-UAE rate, so the stored everyday rate remains withheld pending reconciliation. Bill payments through Mashreq Online and Mobile Banking App do not earn cashback. No unrestricted-spend total return is calculated." };
  // Clear the duplicate prose claim, not the protected numeric rates. Keep raw
  // source freetext unchanged as an audit trail of the previous capture.
  current.earnUnit = "% cashback";
  current.perks = (current.perks as string[]).map(line => /no monthly cashback cap/i.test(line)
    ? "Cashback-eligible spend is limited by the assigned credit-card limit in each statement cycle. The other-UAE base is Pending because the product and KFS use different bounds."
    : /0\.33% cashback on government payments/.test(line)
      ? "Reduced sector rates do not override the exclusion for bill payments made through Mashreq Online and Mobile Banking App." : line);
  current._lastReviewed = reviewedOn;
  return { slug: "mashreq-cashback", state: "source-backed-editorial-hold-not-whole-card-refresh", beforeSha256: hash(JSON.stringify(before)), before, record: current, condition, conflict };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sources = JSON.parse(readFileSync("tests/scrape/fixtures/2026-11-mashreq-primary.json", "utf8")).sources.map((s: { textDeflateBase64: string }) => ({ ...s, text: inflateSync(Buffer.from(s.textDeflateBase64, "base64")).toString("utf8") })) as PrimaryCardSource[];
  const product = sources.find(s => s.id === "mashreq-cashback-product"), kfs = sources.find(s => s.id === "mashreq-card-kfs");
  if (!product || !kfs) throw new Error("Missing source fixtures");
  const before = JSON.parse(readFileSync("src/data/cards.json", "utf8"))["mashreq-cashback"];
  process.stdout.write(JSON.stringify(parseMashreqCashbackHold(before, product, kfs, process.argv[2] ?? ""), null, 2) + "\n");
}
