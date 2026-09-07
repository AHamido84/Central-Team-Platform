// Derived campaign metrics. Every function returns `null` (never `Infinity`
// or `NaN`) when its denominator is zero, so callers can render "—" instead
// of a garbage number. Inputs are plain numbers — callers convert Prisma
// `Decimal` fields with `.toNumber()` before calling in, keeping this module
// framework/ORM-agnostic and trivially unit-testable.

export function computeCTR(clicks: number, impressions: number): number | null {
  if (impressions <= 0) return null;
  return (clicks / impressions) * 100;
}

export function computeCPC(spend: number, clicks: number): number | null {
  if (clicks <= 0) return null;
  return spend / clicks;
}

export function computeCPL(spend: number, leads: number): number | null {
  if (leads <= 0) return null;
  return spend / leads;
}

export function computeROAS(revenue: number, spend: number): number | null {
  if (spend <= 0) return null;
  return revenue / spend;
}
