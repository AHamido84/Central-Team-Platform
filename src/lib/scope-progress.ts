import type { ScopeItemStatus, ScopeProgressMode } from "@prisma/client";

export type ScopeItemProgressInput = {
  quantity: number | null;
  status: ScopeItemStatus;
  progressMode: ScopeProgressMode;
  manualProgressPercent: number | null;
  weight: number | null;
  /** Real task completion counts for this item, when progressMode is
   * TASK_BASED — e.g. from a `Task.groupBy({ by: ["scopeItemId", "status"] })`
   * query. Without it, TASK_BASED falls back to the item's own status
   * (same as QUANTITY mode) rather than guessing. */
  taskStats?: { total: number; done: number };
};

export type ScopeItemProgress = {
  /** This item's contribution to its category's "contracted" total —
   * quantity in every mode except WEIGHTED, where it's the item's weight. */
  contracted: number;
  /** The completed share of `contracted`. */
  completed: number;
  /** 0-100. */
  percent: number;
};

function statusBasedProgress(quantity: number, status: ScopeItemStatus): ScopeItemProgress {
  if (status === "COMPLETED") return { contracted: quantity, completed: quantity, percent: 100 };
  if (status === "IN_PROGRESS") {
    return { contracted: quantity, completed: Math.round(quantity * 0.5), percent: 50 };
  }
  return { contracted: quantity, completed: 0, percent: 0 };
}

/**
 * Never hardcodes a percent — every branch derives it from real stored data
 * (status, a real task completion ratio, an admin-entered manual percent,
 * or a weight the admin set). See ScopeProgressMode in schema.prisma for
 * what each mode means.
 */
export function computeScopeItemProgress(item: ScopeItemProgressInput): ScopeItemProgress {
  const quantity = item.quantity ?? 1;

  switch (item.progressMode) {
    case "MANUAL": {
      const percent = Math.max(0, Math.min(100, item.manualProgressPercent ?? 0));
      return {
        contracted: quantity,
        completed: Math.round((quantity * percent) / 100),
        percent,
      };
    }
    case "TASK_BASED": {
      if (!item.taskStats || item.taskStats.total === 0) {
        return statusBasedProgress(quantity, item.status);
      }
      const percent = Math.round((item.taskStats.done / item.taskStats.total) * 100);
      return {
        contracted: quantity,
        completed: Math.round((quantity * percent) / 100),
        percent,
      };
    }
    case "WEIGHTED": {
      const weight = item.weight ?? quantity;
      const { percent } = statusBasedProgress(quantity, item.status);
      return {
        contracted: weight,
        completed: Math.round((weight * percent) / 100),
        percent,
      };
    }
    case "QUANTITY":
    default:
      return statusBasedProgress(quantity, item.status);
  }
}
