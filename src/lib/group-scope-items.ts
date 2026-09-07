import type { ScopeItemCategory, ScopeItemStatus, ScopeProgressMode } from "@prisma/client";
import { computeScopeItemProgress } from "@/lib/scope-progress";

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

export type ScopeGroupableItem = {
  id?: string;
  category: ScopeItemCategory;
  quantity: number | null;
  status: ScopeItemStatus;
  unit?: string | null;
  progressMode?: ScopeProgressMode;
  manualProgressPercent?: number | null;
  weight?: number | null;
};

/**
 * Rolls scope items up by category using each item's own progress mode
 * (see src/lib/scope-progress.ts) — a mix of quantity-based, task-based,
 * manual, and weighted items in the same category all combine correctly,
 * since every mode ultimately produces a `contracted`/`completed` pair in
 * the same unit.
 */
export function groupScopeItemsByCategory(
  items: ScopeGroupableItem[],
  taskStatsByItemId?: Map<string, { total: number; done: number }>,
): ScopeCategoryGroup[] {
  const byCategory = new Map<ScopeItemCategory, ScopeCategoryGroup>();
  for (const item of items) {
    if (item.status === "CANCELLED") continue;
    const progress = computeScopeItemProgress({
      quantity: item.quantity,
      status: item.status,
      progressMode: item.progressMode ?? "QUANTITY",
      manualProgressPercent: item.manualProgressPercent ?? null,
      weight: item.weight ?? null,
      taskStats: item.id ? taskStatsByItemId?.get(item.id) : undefined,
    });
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
    group.total += progress.contracted;
    group.completed += progress.completed;
    if (item.status === "IN_PROGRESS") group.inProgress += progress.contracted;
    else if (item.status !== "COMPLETED") group.planned += progress.contracted;
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
