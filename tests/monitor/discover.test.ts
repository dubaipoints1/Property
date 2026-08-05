// Unit tests for registry-URL discovery ranking.
//
// Run: node --import tsx --test tests/monitor/discover.test.ts
//
// The assertion that matters most here is the PDF inversion: a T&C
// document must rank IN for salary-transfer and OUT for offers. That
// inversion is the entire reason the two surfaces have separate config
// rather than sharing one reject rule, and it is trivially easy to
// regress by "tidying up" the two regexes into one.
//
// Ranking had no test coverage at all before this — discover-offers.mjs
// shipped in the 2026-08 monitoring work untested.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { rank, bankOrigins } from "../../scripts/monitor/_discover.mjs";
import { OFFERS_CONFIG } from "../../scripts/monitor/discover-offers.mjs";
import { SALARY_TRANSFER_CONFIG } from "../../scripts/monitor/discover-salary-transfer.mjs";

// ── the inversion ─────────────────────────────────────────────────────

test("a salary-transfer T&C PDF ranks in for salary-transfer", () => {
  // DIB's real shipped sourceUrl shape.
  const urls = ["https://www.dib.ae/docs/default-source/pdf/dib-salary-tc.pdf"];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), urls);
});

test("a PDF ranks out for offers", () => {
  // Same document, offers config — rejected as noise around the landing
  // page. If this ever passes, the two reject rules have been merged and
  // the offers monitor will start watching T&C documents.
  const urls = ["https://www.dib.ae/docs/default-source/pdf/dib-offers-tc.pdf"];
  assert.deepEqual(rank(urls, OFFERS_CONFIG), []);
});

test("a /terms path ranks in for salary-transfer but out for offers", () => {
  const st = ["https://www.mashreq.com/en/uae/salary-transfer/terms"];
  const of = ["https://www.mashreq.com/en/uae/offers/terms"];
  assert.equal(rank(st, SALARY_TRANSFER_CONFIG).length, 1);
  assert.deepEqual(rank(of, OFFERS_CONFIG), []);
});

// ── ordering ──────────────────────────────────────────────────────────

test("higher-confidence patterns outrank lower ones", () => {
  const urls = [
    "https://www.x.ae/personal/payroll",
    "https://www.x.ae/salary-transfer",
  ];
  // /salary-transfer is pattern 0; /payroll is pattern 4.
  assert.equal(rank(urls, SALARY_TRANSFER_CONFIG)[0], "https://www.x.ae/salary-transfer");
});

test("shorter paths win within the same pattern", () => {
  const urls = [
    "https://www.x.ae/personal/accounts/salary-transfer/",
    "https://www.x.ae/salary-transfer/",
  ];
  assert.equal(rank(urls, SALARY_TRANSFER_CONFIG)[0], "https://www.x.ae/salary-transfer/");
});

test("offers ranking is unchanged by the refactor", () => {
  const urls = [
    "https://www.x.ae/personal/cards/promotions",
    "https://www.x.ae/offers",
  ];
  assert.deepEqual(rank(urls, OFFERS_CONFIG), [
    "https://www.x.ae/offers",
    "https://www.x.ae/personal/cards/promotions",
  ]);
});

// ── filtering ─────────────────────────────────────────────────────────

test("non-matching URLs are dropped entirely", () => {
  const urls = [
    "https://www.x.ae/about-us",
    "https://www.x.ae/branch-locator",
    "https://www.x.ae/careers",
  ];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), []);
  assert.deepEqual(rank(urls, OFFERS_CONFIG), []);
});

test("archives, expired campaigns and year-stamped paths are rejected", () => {
  const urls = [
    "https://www.x.ae/salary-transfer/archive",
    "https://www.x.ae/salary-transfer/expired",
    "https://www.x.ae/2024/salary-transfer",
  ];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), []);
});

test("images are rejected for salary-transfer", () => {
  const urls = ["https://www.x.ae/salary-transfer/hero.png"];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), []);
});

test("duplicates collapse and the limit is honoured", () => {
  const dupes = ["https://www.x.ae/salary-transfer", "https://www.x.ae/salary-transfer"];
  assert.equal(rank(dupes, SALARY_TRANSFER_CONFIG).length, 1);

  const many = Array.from({ length: 20 }, (_, i) => `https://www.x.ae/salary-transfer/v${i}`);
  assert.equal(rank(many, SALARY_TRANSFER_CONFIG).length, SALARY_TRANSFER_CONFIG.limit);
  assert.equal(rank(many, OFFERS_CONFIG).length, 0); // not an offers surface
});

test("a malformed URL does not throw", () => {
  // firecrawlMap output is external input; a bad entry should be skipped
  // rather than taking the whole discovery run down.
  const urls = ["not-a-url-but-mentions-salary-transfer", "https://www.x.ae/salary-transfer"];
  assert.deepEqual(rank(urls, SALARY_TRANSFER_CONFIG), ["https://www.x.ae/salary-transfer"]);
});

// ── noise from discovery run 30982700538 ──────────────────────────────
//
// Every URL below is verbatim from that run's output. Using the real
// strings rather than invented ones means these tests fail if a future
// pattern edit lets back in exactly the noise we saw, rather than
// something merely similar to it.

test("non-UAE market pages are rejected", () => {
  // Standard Chartered's ONLY candidate in run 1 was Nigeria; the retry
  // pass in run 2 then surfaced Nepal. Mashreq offered Egypt. The rule is
  // inverted (anything but /ae/) precisely because enumerating ~60 SC
  // markets would always be one country behind.
  const foreign = [
    "https://www.sc.com/ng/save/salary-account",
    "https://www.sc.com/np/deposits/payroll-plus-account",
    "https://www.mashreq.com/en/egypt/personal/loans/personal-loans/payroll-loans",
  ];
  assert.deepEqual(rank(foreign, SALARY_TRANSFER_CONFIG), []);
});

test("a market code never seen before is still rejected", () => {
  // The point of inverting the rule: these are not in any list.
  const unseen = [
    "https://www.sc.com/bw/save/salary-account",
    "https://www.sc.com/zm/save/salary-account",
  ];
  assert.deepEqual(rank(unseen, SALARY_TRANSFER_CONFIG), []);
});

test("the UAE market segment survives", () => {
  // sc.com/ae/… is the real Standard Chartered page — run 2 found it via
  // the retry pass. If the market rule ever rejects this, the only
  // candidate we have for that bank disappears.
  const ae = "https://www.sc.com/ae/save/salary-account/apply";
  assert.deepEqual(rank([ae], SALARY_TRANSFER_CONFIG), [ae]);
});

test("a leading /en/ language segment is not treated as a market", () => {
  // Mashreq puts language first (/en/uae/…). Rejecting two-letter leading
  // segments naively would drop its genuine candidates.
  const en = "https://www.mashreq.com/en/uae/neo/accounts/current-accounts/salary-transfer";
  assert.deepEqual(rank([en], SALARY_TRANSFER_CONFIG), [en]);
});

test("non-market paths beginning with letters are unaffected", () => {
  // /docs/, /Images/ and /-/media/ must not look like market codes.
  const paths = [
    "https://www.dib.ae/docs/default-source/pdf/9684-salary-transfer-tc.pdf",
    "https://www.adib.ae/-/media/project/adib/adibsite/docs/personal/accounts/salary-bonus/salary-bonus-program-tcs-en.pdf",
  ];
  const kept = rank(paths, { ...SALARY_TRANSFER_CONFIG, limit: 20 });
  for (const p of paths) assert.ok(kept.includes(p), `${p} was wrongly rejected`);
});

test("a two-letter market code does not fire inside a longer word", () => {
  // /in/ must not match "banking", "insurance", "savings" etc. The rule
  // is a path-segment match precisely to avoid this.
  const ok = "https://www.x.ae/en/personal-banking/insurance/salary-transfer";
  assert.deepEqual(rank([ok], SALARY_TRANSFER_CONFIG), [ok]);
});

test("credit products are rejected — an advance is not a transfer bonus", () => {
  // CBD's only candidate. A salary advance is a loan against future pay.
  const cbd =
    "https://www.cbd.ae/docs/default-source/default-document-library/salaryadvance_t-c.pdf";
  assert.deepEqual(rank([cbd], SALARY_TRANSFER_CONFIG), []);
});

test("B2B payroll services are rejected", () => {
  // The bank selling WPS processing to employers — not an offer a reader
  // can take. Emirates Islamic and RAKBANK both surfaced these.
  const b2b = [
    "https://www.emiratesislamic.ae/en/business-banking/payroll-solution",
    "https://www.rakbank.ae/en/business/business-solutions/payroll-solutions",
  ];
  assert.deepEqual(rank(b2b, SALARY_TRANSFER_CONFIG), []);
});

test("Arabic mirrors are dropped but their English equivalent is kept", () => {
  const ar = "https://www.rakbank.ae/ar/islamic/personal/everyday-banking/accounts-facilities/salary-transfer";
  const en = "https://www.rakbank.ae/en/islamic/personal/everyday-banking/accounts-facilities/salary-transfer";
  assert.deepEqual(rank([ar, en], SALARY_TRANSFER_CONFIG), [en]);
});

test("the genuine candidates from the run all survive", () => {
  // The whole point: tightening the reject rule must not claw back the
  // real finds, especially the T&C documents this surface exists for.
  const good = [
    "https://www.rakbank.ae/en/everyday-banking/salary-transfer",
    "https://www.emiratesnbd.com/en/campaigns/transfer-your-salary-earn-more",
    "https://www.emiratesnbd.com/-/media/enbd/files/pdf/transfer_your_salary_win_rewards_tc.pdf",
    "https://www.dib.ae/docs/default-source/pdf/9684-salary-transfer-tc.pdf",
    "https://www.adib.ae/-/media/project/adib/adibsite/docs/personal/accounts/salary-bonus/salary-bonus-program-tcs-en.pdf",
    "https://www.mashreq.com/en/uae/neo/accounts/current-accounts/salary-transfer",
  ];
  const kept = rank(good, { ...SALARY_TRANSFER_CONFIG, limit: 20 });
  for (const u of good) {
    assert.ok(kept.includes(u), `${u} was wrongly rejected`);
  }
});

test("the offers surface is unaffected by the salary-transfer rejects", () => {
  // The two configs must stay independent — a /business/ offers page is
  // still a legitimate offers candidate.
  const offersUrl = "https://www.x.ae/en/offers";
  assert.deepEqual(rank([offersUrl], OFFERS_CONFIG), [offersUrl]);
});


// ── the segment-anchoring bug (found 5 August 2026) ───────────────────

test("a salary-transfer slug SUFFIX is matched, not just a segment start", () => {
  // The bug that hid two banks for months. Patterns 0/2/3 require a "/"
  // immediately before "salary", but both of these end in the phrase:
  //   /promotions/20-percent-cashback-on-salary-transfers   (FAB)
  //   /promotions/switch-nine-salary-transfer               (ADCB)
  // Discovery reported "no candidate found" for both — FAB being the
  // largest bank in the country — on that single character.
  const missed = [
    "https://www.bankfab.com/en-ae/personal/promotions/20-percent-cashback-on-salary-transfers",
    "https://www.adcb.com/en/personal/promotions/switch-nine-salary-transfer",
  ];
  for (const u of missed) {
    assert.deepEqual(rank([u], SALARY_TRANSFER_CONFIG), [u], `not matched: ${u}`);
  }
});

test("a promotions parent is matched like a campaigns parent", () => {
  // Banks file these under either word; they behave identically.
  const promo = "https://www.x.ae/en/personal/promotions/big-salary-offer";
  const camp = "https://www.x.ae/en/campaigns/big-salary-offer";
  assert.equal(rank([promo], SALARY_TRANSFER_CONFIG).length, 1);
  assert.equal(rank([camp], SALARY_TRANSFER_CONFIG).length, 1);
});

test("the loosened rule does not weaken any reject", () => {
  // Matching the phrase anywhere must not readmit the noise the tightened
  // reject rules exist to strip.
  const noise = [
    "https://www.cbd.ae/docs/default-source/default-document-library/salaryadvance_t-c.pdf",
    "https://www.sc.com/ng/save/salary-account",
    "https://www.sc.com/np/deposits/payroll-plus-account",
    "https://www.mashreq.com/en/egypt/personal/loans/personal-loans/payroll-loans",
    "https://www.emiratesislamic.ae/en/business-banking/payroll-solution",
    "https://www.rakbank.ae/ar/islamic/personal/everyday-banking/accounts-facilities/salary-transfer",
  ];
  assert.deepEqual(rank(noise, SALARY_TRANSFER_CONFIG), []);
});

test("an anchored segment match still outranks a mid-slug one", () => {
  // The loose rule is ranked last on purpose — a real segment match must
  // still come first, or the ordering stops meaning anything.
  const anchored = "https://www.x.ae/en/salary-transfer";
  const suffix = "https://www.x.ae/en/promotions/cashback-on-salary-transfer";
  assert.equal(rank([suffix, anchored], SALARY_TRANSFER_CONFIG)[0], anchored);
});


// ── noise classes exposed by the loosened rule (run 31003139057) ──────
//
// Widening the match to slug suffixes tripled the candidate count and let
// four new noise classes through. Every URL below is verbatim from that
// run.

test("salary-BACKED LOANS are rejected — they are not transfer offers", () => {
  // Same category error as CBD's salary-advance, different words. These
  // are loans secured against a salary transfer.
  const loans = [
    "https://www.emiratesnbd.com/en/loans/personal-loans/salary-transfer-loans-for-expats",
    "https://www.emiratesnbd.com/en/loans/personal-loans/salary-transfer-loans-for-uae-nationals",
    "https://www.rakbank.ae/en/islamic/help-centre/product-terms-kfs/terms-and-conditions/personal-finance-salary-transfer",
  ];
  assert.deepEqual(rank(loans, SALARY_TRANSFER_CONFIG), []);
});

test("letter templates and application forms are rejected", () => {
  // A form an employer fills in carries no terms and is not an offer.
  const forms = [
    "https://www.emiratesislamic.ae/-/media/ei/pdfs/Personal-Banking/EIB_Salary_Transfer_Letter_Format.pdf",
    "https://www.sc.com/global/av/ae-salary-transfer-format.pdf",
    "https://cdn.emiratesnbd.com/enbd/files/pdf/form-center/account/salary-transfer-letter-format.pdf",
  ];
  assert.deepEqual(rank(forms, SALARY_TRANSFER_CONFIG), []);
});

test("editorial debris is rejected", () => {
  // A page the bank forgot to unpublish, and a prize list.
  const debris = [
    "https://www.emiratesislamic.ae/en/offers/salary-transfer-offer-delete",
    "https://www.dib.ae/docs/default-source/pdf/9634-xtra-salary-transfer-winners.pdf",
  ];
  assert.deepEqual(rank(debris, SALARY_TRANSFER_CONFIG), []);
});

test("the /ar-ae/ locale form is rejected, not just /ar/", () => {
  // FAB uses ar-ae. The original rule only knew /ar/, so its Arabic
  // mirror slipped through the loosened match.
  const ar = "https://www.bankfab.com/ar-ae/personal/accounts/salary-transfer-account";
  const en = "https://www.bankfab.com/en-ae/personal/accounts/salary-transfer-account";
  assert.deepEqual(rank([ar, en], SALARY_TRANSFER_CONFIG), [en]);
});

test("the genuine new candidates from that run all survive", () => {
  // Emirates Islamic went from one rejected payroll-card to a real offer
  // page plus two banded T&C documents. Tightening must not undo that.
  const good = [
    "https://www.emiratesislamic.ae/en/offers/salary-transfer-cashback",
    "https://www.emiratesislamic.ae/-/media/ei/pdfs/terms-and-condition/offers/salarytransferoffer_6k_tnc_en.pdf",
    "https://www.emiratesislamic.ae/-/media/ei/pdfs/terms-and-condition/offers/salarytransferoffer_16k_tnc_en.pdf",
    "https://www.emiratesnbd.com/en/promotions/salary-transfer-account-offer",
    "https://www.mashreq.com/-/jssmedia/pdfs/gold/mg-salary-transfer-tc-en.ashx",
    "https://www.bankfab.com/en-ae/personal/accounts/salary-transfer-account",
  ];
  const kept = rank(good, { ...SALARY_TRANSFER_CONFIG, limit: 20 });
  for (const u of good) assert.ok(kept.includes(u), `wrongly rejected: ${u}`);
});

// ── origins ───────────────────────────────────────────────────────────

test("bankOrigins covers every bank in the scrape registry", () => {
  const origins = bankOrigins();
  const registry = JSON.parse(
    readFileSync("scripts/scrape/banks.registry.json", "utf8"),
  ).banks as string[];
  for (const slug of registry) {
    assert.ok(origins.has(slug), `no origin derived for ${slug}`);
    assert.ok(origins.get(slug)!.startsWith("https://"), `${slug} origin is not https`);
  }
});
