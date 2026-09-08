import type { TaskStatus } from "@prisma/client";

/** A task in one of these statuses still counts against someone's workload —
 * mirrors the set `team/page.tsx` and the dashboards already count by. */
export const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "CHANGES_REQUIRED",
];

/** Narrower than ACTIVE_TASK_STATUSES — "currently being worked," excluding
 * TODO. Used for "in progress" stat cards, as opposed to workload counts
 * (which should include not-yet-started assigned work). */
export const IN_PROGRESS_TASK_STATUSES: TaskStatus[] = [
  "IN_PROGRESS",
  "BLOCKED",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "CHANGES_REQUIRED",
];

/** Soft threshold only — spec §15 says "if overloaded, show a warning" and
 * "allow according to permissions," never a hard block. */
export const WORKLOAD_WARNING_THRESHOLD = 8;

export function isOverloaded(activeTaskCount: number): boolean {
  return activeTaskCount >= WORKLOAD_WARNING_THRESHOLD;
}
