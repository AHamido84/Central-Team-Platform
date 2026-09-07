import type { ScopeItemCategory, ScopeItemStatus } from "@prisma/client";

export type ScopeCategoryGroup = {
  category: ScopeItemCategory;
  /** Contracted quantity — "الكمية المتعاقد عليها". */
  total: number;
  /** "المنجز". */
  completed: number;
  inProgress: number;
  planned: number;
  /** "المتبقي" — always total - completed, kept as its own field so
   * callers never have to re-derive it. */
  remaining: number;
  dominantStatus: ScopeItemStatus;
  /** First non-null unit seen for this category ("تصميم", "فيديو", ...) —
   * items within one category normally share a unit; shown as "الوحدة". */
  unit: string | null;
};

/**
 * Rolls scope items up by category with a quantity-weighted completed/total
 * count, so both the portal and internal scope tabs render the exact same
 * per-category progress bars from the same input shape.
 */
export function groupScopeItemsByCategory(
  items: { category: ScopeItemCategory; quantity: number | null; status: ScopeItemStatus; unit?: string | null }[],
): ScopeCategoryGroup[] {
  const byCategory = new Map<ScopeItemCategory, ScopeCategoryGroup>();
  for (const item of items) {
    if (item.status === "CANCELLED") continue;
    const qty = item.quantity ?? 1;
    const group = byCategory.get(item.category) ?? {
      category: item.category,
      total: 0,
      completed: 0,
      inProgress: 0,
      planned: 0,
      remaining: 0,
      dominantStatus: "PLANNED" as ScopeItemStatus,
      unit: null,
    };
    group.total += qty;
    if (item.status === "COMPLETED") group.completed += qty;
    else if (item.status === "IN_PROGRESS") group.inProgress += qty;
    else group.planned += qty;
    if (!group.unit && item.unit) group.unit = item.unit;
    byCategory.set(item.category, group);
  }
  for (const group of byCategory.values()) {
    group.remaining = group.total - group.completed;
    // "In progress" covers both an item literally marked IN_PROGRESS and a
    // category that's partially done (some completed, some still planned) —
    // otherwise a 60%-complete category would misleadingly read as
    // "Planned" just because none of its remaining items are individually
    // marked in-progress yet.
    group.dominantStatus =
      group.completed === group.total
        ? "COMPLETED"
        : group.inProgress > 0 || group.completed > 0
          ? "IN_PROGRESS"
          : "PLANNED";
  }
  return Array.from(byCategory.values());
}
