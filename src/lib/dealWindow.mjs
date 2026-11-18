const DAY_MS = 86_400_000;
// Dubai stays UTC+04:00 year-round. Collection calendar dates are stored
// as UTC midnight; that storage encoding is not the issuer's cutoff.
const DUBAI_OFFSET_MS = 4 * 3_600_000;

/** @param {number} timeMs */
function dubaiDay(timeMs) {
  return Math.floor((timeMs + DUBAI_OFFSET_MS) / DAY_MS);
}

/** @param {Date} expiresOn @param {Date} [expiresAt] */
export function dealDeadlineMs(expiresOn, expiresAt) {
  const storedMs = expiresOn.getTime();
  if (!Number.isFinite(storedMs)) return NaN;
  // YAML may already have coerced an explicit midnight to Date. A pinned
  // cutoff, including midnight UTC, belongs in the explicit expiresAt field.
  if (expiresAt !== undefined) return expiresAt.getTime();
  if (storedMs % DAY_MS !== 0) return storedMs; // legacy explicit instant
  return storedMs + DAY_MS - DUBAI_OFFSET_MS - 1;
}

/** @param {{expiresOn: Date, expiresAt?: Date, archived?: boolean}} deal @param {number} nowMs */
export function isDealLiveAt(deal, nowMs) {
  return Number.isFinite(nowMs) && !deal.archived && nowMs <= dealDeadlineMs(deal.expiresOn, deal.expiresAt);
}

/** @param {Date} expiresOn @param {number} nowMs @param {Date} [expiresAt] */
export function dealCalendarDaysUntil(expiresOn, nowMs, expiresAt) {
  return dubaiDay(dealDeadlineMs(expiresOn, expiresAt)) - dubaiDay(nowMs);
}
