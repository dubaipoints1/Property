// Salary-transfer URL discovery — one-off helper, human-reviewed output.
//
// The salary-transfer tracker is a Charter-named differentiator that had
// no automation behind it until August 2026: nothing read or wrote
// salaryTransferOffers, and the monitors watched fee docs, product pages,
// card offers and press rooms but no salary-transfer surface. This script
// proposes the pages to watch so salary-transfer.registry.json can be
// populated and the monitor stops being SKIPPED.
//
// Usage:
//   FIRECRAWL_API_KEY=... node scripts/monitor/discover-salary-transfer.mjs
//   FIRECRAWL_API_KEY=skip node scripts/monitor/discover-salary-transfer.mjs
//
// Output: prints a reviewable block per bank. Copy confirmed URLs into
// scripts/monitor/salary-transfer.registry.json — BY HAND. A monitor
// pointed at a guessed page is worse than none, because we would then
// trust it.

import { runDiscovery } from "./_discover.mjs";

// Ordered by confidence. An explicit /salary-transfer path is the
// strongest signal; a generic /payroll or campaign page is weaker but
// still worth showing a human.
export const SALARY_TRANSFER_PATTERNS = [
  /\/salary[-_]?transfers?(\/|$)/i,
  /transfer[-_]?your[-_]?salary/i,
  /\/salary[-_]?accounts?(\/|$)/i,
  /\/salary(\/|$)/i,
  /\/payroll/i,
  /salary.*t-?&?cs?.*\.pdf$/i,
  /\/campaigns?\/.*salary/i,
];

// Deliberately NARROWER than the offers reject rule.
//
// discover-offers.mjs rejects `.pdf`, `/terms` and `/tnc` because for a
// promotions landing page those are noise. For salary transfer they are
// the target: the salary bands, payout months and clawback terms live in
// the T&C document, not the marketing page. DIB's shipped sourceUrl is
// literally dib.ae/docs/default-source/pdf/dib-xtra-tc.pdf.
//
// So this keeps PDFs and terms pages and rejects only what is genuinely
// not a durable salary-transfer surface: images, archives, expired
// campaigns, and year-stamped paths.
export const SALARY_TRANSFER_REJECT = /\.(jpg|jpeg|png|gif|svg)$|\/archive|\/expired|\/\d{4}\//i;

export const SALARY_TRANSFER_CONFIG = {
  surface: "salary-transfer",
  search: "salary transfer",
  patterns: SALARY_TRANSFER_PATTERNS,
  reject: SALARY_TRANSFER_REJECT,
  // Higher than the offers limit of 5: we want the landing page AND its
  // T&C document, and banks often publish several salary-account
  // variants (conventional vs Islamic, NEO vs branch).
  limit: 8,
  registryPath: "scripts/monitor/salary-transfer.registry.json",
};

if (process.argv[1] && process.argv[1].endsWith("discover-salary-transfer.mjs")) {
  await runDiscovery(SALARY_TRANSFER_CONFIG);
}
