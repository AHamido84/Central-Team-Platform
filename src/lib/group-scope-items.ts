import type { ScopeItemCategory, ScopeItemStatus } from "@prisma/client";

export type ScopeCategoryGroup = {
  category: ScopeItemCategory;
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  dominantStatus: ScopeItemStatus;
};

/**
 * Rolls scope items up by category with a quantity-weighted completed/total
 * count, so both the portal and internal scope tabs render the exact same
 * per-category progress bars from the same input shape.
 */
export function groupScopeItemsByCategory(
  items: { category: ScopeItemCategory; quantity: number | null; status: ScopeItemStatus }[],
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
      dominantStatus: "PLANNED" as ScopeItemStatus,
    };
    group.total += qty;
    if (item.status === "COMPLETED") group.completed += qty;
    else if (item.status === "IN_PROGRESS") group.inProgress += qty;
    else group.planned += qty;
    byCategory.set(item.category, group);
  }
  for (const group of byCategory.values()) {
    group.dominantStatus =
      group.completed === group.total ? "COMPLETED" : group.inProgress > 0 ? "IN_PROGRESS" : "PLANNED";
  }
  return Array.from(byCategory.values());
}
