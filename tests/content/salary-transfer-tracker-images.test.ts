import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { bankMark } from "../../src/lib/logos.ts";
import { getTrackerCardPaths } from "../../src/lib/salaryTransferTrackerImages.ts";

const dib = {
  id: "dib-xtra-2026",
  bankSlug: "dib",
  sourceUrl: "https://www.dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf",
};

test("DIB XTRA is a finance-or-card bundle and its example has exact issuer art", () => {
  const [path] = Object.values(getTrackerCardPaths([dib]));
  assert.equal(path.financeAlternative, true);
  assert.equal(path.example?.slug, "dib-consumer-cashback");
  assert.ok(path.example?.src && existsSync(`public${path.example.src}`));
});

test("same bank, a different campaign or an unmatched source does not inherit art or terms", () => {
  assert.deepEqual(getTrackerCardPaths([
    { ...dib, id: "dib-new-campaign" },
    { ...dib, sourceUrl: "https://www.dib.ae/other-terms" },
    { ...dib, bankSlug: "fab" },
  ]), {});
});

test("live tracker issuers have local bank marks, with a dark plate for white-only DIB art", () => {
  for (const bank of ["emirates-islamic", "fab", "hsbc", "mashreq", "dib", "emirates-nbd"]) {
    const mark = bankMark(bank);
    assert.ok(existsSync(`public${mark.src}`), bank);
    assert.equal(mark.plated, bank === "dib");
  }
});
