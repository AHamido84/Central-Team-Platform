"use client";

import { useTranslations } from "next-intl";
import { KanbanBoard, type KanbanColumn } from "@/components/portal/kanban-board";
import { updateTaskStatusAction } from "@/lib/actions/task-actions";
import type { TaskStatus } from "@prisma/client";

type TaskCard = {
  id: string;
  status: TaskStatus;
  title: string;
  projectName: string;
  assigneeName?: string | null;
};

/** Known error codes updateTaskStatusAction can throw, mapped to a
 * translated toast — same code-not-string convention as server action form
 * errors (see ConfirmDeleteDialog's "hasDependencies" handling). */
const KNOWN_ERROR_KEYS = ["dependencyBlocked"] as const;

export function TasksBoard({
  columns,
  tasks,
}: {
  columns: KanbanColumn[];
  tasks: TaskCard[];
}) {
  const t = useTranslations("tasks");

  return (
    <KanbanBoard
      columns={columns}
      items={tasks.map((task) => ({
        id: task.id,
        columnId: task.status,
        title: task.title,
        meta: `${task.projectName}${task.assigneeName ? ` · ${task.assigneeName}` : ""}`,
      }))}
      onMove={async (itemId, columnId) => {
        try {
          await updateTaskStatusAction(itemId, columnId as TaskStatus);
        } catch (error) {
          const code = error instanceof Error ? error.message : String(error);
          if ((KNOWN_ERROR_KEYS as readonly string[]).includes(code)) {
            throw new Error(t(`toast.${code}` as "toast.dependencyBlocked"));
          }
          throw error;
        }
      }}
    />
  );
}
