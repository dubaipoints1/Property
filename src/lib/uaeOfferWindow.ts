/** Date-only UAE offers are inclusive of the final UAE calendar day.
 * The UAE is UTC+04:00 year-round. Invalid instants fail closed.
 */
export function isUaeOfferWindow(from: string, through: string, epochMs: number): boolean {
  const local = new Date(epochMs + 4 * 60 * 60 * 1000);
  if (!Number.isFinite(local.getTime())) return false;
  const day = local.toISOString().slice(0, 10);
  return day >= from && day <= through;
}
