/** Percent change between two real period counts. `null` when there's
 * nothing in the prior period to compare against (avoids a misleading
 * 0%/Infinity%). */
export function computeTrendPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
