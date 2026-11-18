import { SOURCE_NUMBER, parseSourceNumber } from "./_lib.ts";

// Deterministic scan of the issuer's Nov–Jan Wealth$aver terms text
// (pdftotext -layout). Never use the headline or the fixed-deposit table.
export function parseStandardCharteredPayroll(source: string) {
  const text = source.replace(/\s+/g, " ");
  const date = text.match(/Campaign Period between (\d+)(?:st|nd|rd|th) November (\d{4}) and (\d+)(?:st|nd|rd|th) January (\d{4}), both days inclusive/i);
  const section = text.match(/9\. Salary Transfer Cashback:(.*?)10\. In the event/i)?.[1];
  if (!date || !section) return null;
  const amounts = section.match(new RegExp(
    `i\\. Salary transfer of AED (${SOURCE_NUMBER}) to AED (${SOURCE_NUMBER}) will receive AED (${SOURCE_NUMBER}) cashback ii\\. Salary transfer of AED (${SOURCE_NUMBER}) and above will receive AED (${SOURCE_NUMBER}) cashback`, "i",
  ))?.slice(1).map(parseSourceNumber);
  const tenure = section.match(/subject to (six) consecutive months of salary transfers commencing from the month after account opening/i);
  const prior = section.match(/Existing to Bank clients who have not transferred their salary in (\d{4})/i);
  const payout = section.match(/credited by the end of (\d+)th month following the initial salary credit/i);
  if (!amounts || amounts.some((amount) => amount === null) || !tenure || !prior || !payout) return null;
  const [minLow, maxLow, low, minHigh, high] = amounts as number[];
  if (![minLow, maxLow, low, minHigh, high].every(Number.isSafeInteger) ||
      minLow > maxLow || minHigh !== maxLow + 1 || high <= low) return null;
  const iso = (year: string, month: string, day: string) => `${year}-${month}-${day.padStart(2, "0")}`;
  const validFrom = iso(date[2], "11", date[1]);
  const validUntil = iso(date[4], "01", date[3]);
  if ([validFrom, validUntil].some((day) => !/^\d{4}-\d{2}-(?:0[1-9]|[12][0-9]|30|31)$/.test(day)
    || new Date(day).toISOString().slice(0, 10) !== day) || validFrom > validUntil) return null;
  const tenureMonths = 6;
  const monthsToPayout = Number(payout[1]);
  if (monthsToPayout <= tenureMonths) return null;
  return {
    validFrom, validUntil, tenureMonths, existingNoSalaryYear: Number(prior[1]), monthsToPayout,
    bands: [
      { minSalary: minLow, maxSalary: maxLow, rewardAmount: low },
      { minSalary: minHigh, maxSalary: null, rewardAmount: high },
    ],
  };
}
