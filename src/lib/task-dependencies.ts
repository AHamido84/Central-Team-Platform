import type { TaskStatus } from "@prisma/client";

type Edge = { taskId: string; dependsOnTaskId: string };

/**
 * A task's dependency graph must stay a DAG — adding `newEdge` on top of
 * `existingEdges` must not let you walk from `newEdge.dependsOnTaskId` back
 * to `newEdge.taskId`, or "B depends on A" and "A depends on B" could both
 * exist at once.
 */
export function wouldCreateCycle(existingEdges: Edge[], newEdge: Edge): boolean {
  if (newEdge.taskId === newEdge.dependsOnTaskId) return true;

  const prerequisitesOf = new Map<string, string[]>();
  for (const edge of [...existingEdges, newEdge]) {
    const list = prerequisitesOf.get(edge.taskId) ?? [];
    list.push(edge.dependsOnTaskId);
    prerequisitesOf.set(edge.taskId, list);
  }

  const visited = new Set<string>();
  function reachesStart(fromTaskId: string): boolean {
    if (fromTaskId === newEdge.taskId) return true;
    if (visited.has(fromTaskId)) return false;
    visited.add(fromTaskId);
    return (prerequisitesOf.get(fromTaskId) ?? []).some(reachesStart);
  }

  return reachesStart(newEdge.dependsOnTaskId);
}

/** Statuses that count as "not actually started yet" — the only ones a task
 * with unmet dependencies is still allowed to sit in. */
const PRE_START_STATUSES: TaskStatus[] = ["TODO", "CANCELLED", "BLOCKED"];

export function canTransitionStatus(
  targetStatus: TaskStatus,
  dependsOn: { status: TaskStatus }[],
): boolean {
  if (PRE_START_STATUSES.includes(targetStatus)) return true;
  return dependsOn.every((dep) => dep.status === "COMPLETED");
}

export class DependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DependencyError";
  }
}
