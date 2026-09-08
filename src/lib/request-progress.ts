import type { TaskStatus } from "@prisma/client";

/** A request's progress is always derived from its tasks' statuses — never a
 * stored/settable field, so nothing can set it to 100% while work remains
 * (spec §11). CANCELLED tasks don't count toward either side of the ratio. */
export function requestProgressPercent(tasks: { status: TaskStatus }[]): number {
  const counted = tasks.filter((t) => t.status !== "CANCELLED");
  if (counted.length === 0) return 0;
  const completed = counted.filter((t) => t.status === "COMPLETED").length;
  return Math.round((completed / counted.length) * 100);
}

/** A request may only move to COMPLETED when every non-cancelled task is
 * COMPLETED (a request with zero tasks — never decomposed — is allowed to
 * complete directly). */
export function allTasksComplete(tasks: { status: TaskStatus }[]): boolean {
  const counted = tasks.filter((t) => t.status !== "CANCELLED");
  return counted.every((t) => t.status === "COMPLETED");
}
