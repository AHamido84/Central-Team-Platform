"use client";

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

export function TasksBoard({
  columns,
  tasks,
}: {
  columns: KanbanColumn[];
  tasks: TaskCard[];
}) {
  return (
    <KanbanBoard
      columns={columns}
      items={tasks.map((task) => ({
        id: task.id,
        columnId: task.status,
        title: task.title,
        meta: `${task.projectName}${task.assigneeName ? ` · ${task.assigneeName}` : ""}`,
      }))}
      onMove={(itemId, columnId) => updateTaskStatusAction(itemId, columnId as TaskStatus)}
    />
  );
}
