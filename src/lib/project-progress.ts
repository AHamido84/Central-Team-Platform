import type { ScopeItemStatus } from "@prisma/client";

export type ScopeProgressInput = {
  quantity: number | null;
  status: ScopeItemStatus;
};

export type ProjectProgress = {
  percent: number;
  totalQty: number;
  plannedQty: number;
  inProgressQty: number;
  completedQty: number;
};

/**
 * Quantity-weighted percent complete across a project's scope items.
 * Cancelled items are excluded from the total (they were never delivered and
 * were never going to be), so cancelling an item doesn't drag progress down.
 */
export function computeProjectProgress(items: ScopeProgressInput[]): ProjectProgress {
  let totalQty = 0;
  let plannedQty = 0;
  let inProgressQty = 0;
  let completedQty = 0;

  for (const item of items) {
    if (item.status === "CANCELLED") continue;
    const qty = item.quantity ?? 1;
    totalQty += qty;
    if (item.status === "COMPLETED") completedQty += qty;
    else if (item.status === "IN_PROGRESS") inProgressQty += qty;
    else plannedQty += qty;
  }

  const percent = totalQty === 0 ? 0 : Math.round((completedQty / totalQty) * 100);

  return { percent, totalQty, plannedQty, inProgressQty, completedQty };
}
