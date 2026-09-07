import type { TaskStatus } from "@prisma/client";

/** Tasks don't carry a stored percent — it's derived from status so it can
 * never drift out of sync with the status the client also sees as a badge. */
export const TASK_STATUS_PERCENT: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 50,
  IN_REVIEW: 80,
  DONE: 100,
  CANCELLED: 0,
};

export function taskProgressPercent(status: TaskStatus): number {
  return TASK_STATUS_PERCENT[status];
}
