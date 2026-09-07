"use server";

import { revalidatePath } from "next/cache";
import { taskSchema } from "@/lib/validations/task";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";
import type { TaskStatus } from "@prisma/client";

export type TaskFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createTaskAction(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "tasks.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    scopeItemId: formData.get("scopeItemId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    assigneeId: formData.get("assigneeId") || undefined,
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;
  const clientVisible = formData.get("clientVisible") === "on";

  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      scopeItemId: data.scopeItemId || null,
      title: data.title,
      description: data.description || null,
      assigneeId: data.assigneeId || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientVisible,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "TASK_CREATED",
    entityType: "Task",
    entityId: task.id,
    projectId: data.projectId,
  });

  revalidatePath("/tasks");
  revalidatePath(`/projects/${data.projectId}/tasks`);
}

/**
 * Bound directly to the KanbanBoard's onMove and called from a client
 * component (not through a <form>), so it just throws on failure rather than
 * returning a form state — the board's drop handler catches and toasts.
 */
export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "tasks.update");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    select: { id: true, projectId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: status === "DONE" ? "TASK_COMPLETED" : "TASK_STARTED",
    entityType: "Task",
    entityId: task.id,
    projectId: task.projectId,
  });

  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}/tasks`);
}
