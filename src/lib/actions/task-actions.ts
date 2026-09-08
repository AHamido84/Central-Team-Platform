"use server";

import { revalidatePath } from "next/cache";
import { taskSchema } from "@/lib/validations/task";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { zodFieldErrors } from "@/lib/form-utils";
import { DependencyError, canTransitionStatus, wouldCreateCycle } from "@/lib/task-dependencies";
import { ACTIVE_TASK_STATUSES, isOverloaded } from "@/lib/task-capacity";
import type { TaskStatus } from "@prisma/client";

export type TaskFormState = {
  errors?: Record<string, string>;
  formError?: string;
  warning?: string;
} | undefined;

async function activeTaskCountFor(userId: string, excludeTaskId?: string): Promise<number> {
  return prisma.task.count({
    where: {
      assigneeId: userId,
      status: { in: ACTIVE_TASK_STATUSES },
      ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
    },
  });
}

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
    requestId: formData.get("requestId") || undefined,
    scopeItemId: formData.get("scopeItemId") || undefined,
    departmentId: formData.get("departmentId") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    notes: formData.get("notes") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    priority: formData.get("priority"),
    estimatedHours: formData.get("estimatedHours") || undefined,
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    dependsOnTaskIds: formData.getAll("dependsOnTaskIds").map(String),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;
  const clientVisible = formData.get("clientVisible") === "on";

  // A brand-new task can't be part of an existing cycle back to itself (it
  // has no dependents yet) — the dependency ids just need to exist and, if
  // the task belongs to a request, stay within that same request.
  const dependsOnIds = [...new Set(data.dependsOnTaskIds ?? [])];
  if (dependsOnIds.length > 0) {
    const prerequisites = await prisma.task.findMany({
      where: { id: { in: dependsOnIds } },
      select: { id: true, requestId: true },
    });
    const valid = prerequisites.filter(
      (p) => !data.requestId || p.requestId === data.requestId,
    );
    dependsOnIds.length = 0;
    dependsOnIds.push(...valid.map((p) => p.id));
  }

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        projectId: data.projectId,
        requestId: data.requestId || null,
        scopeItemId: data.scopeItemId || null,
        departmentId: data.departmentId || null,
        title: data.title,
        description: data.description || null,
        notes: data.notes || null,
        assigneeId: data.assigneeId || null,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        clientVisible,
      },
    });
    if (dependsOnIds.length > 0) {
      await tx.taskDependency.createMany({
        data: dependsOnIds.map((dependsOnTaskId) => ({ taskId: created.id, dependsOnTaskId })),
      });
    }
    return created;
  });

  await recordAudit({
    actorId: user.id,
    action: "TASK_CREATED",
    entityType: "Task",
    entityId: task.id,
    projectId: data.projectId,
  });

  let warning: string | undefined;
  if (data.assigneeId) {
    const activeCount = await activeTaskCountFor(data.assigneeId);
    if (isOverloaded(activeCount)) warning = "overloaded";
    await notifyUser(data.assigneeId, {
      type: "TASK_ASSIGNED",
      title: task.title,
      link: `/tasks/${task.id}`,
    });
  }

  revalidatePath("/tasks");
  revalidatePath(`/projects/${data.projectId}/tasks`);
  if (data.requestId) revalidatePath(`/requests/${data.requestId}`);

  return warning ? { warning } : undefined;
}

/**
 * Bound directly to the KanbanBoard's onMove and called from a client
 * component (not through a <form>), so it just throws on failure rather than
 * returning a form state — the caller's catch (see tasks-board.tsx) surfaces
 * the message as a toast.
 */
export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "tasks.update");

  const existing = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: {
      projectId: true,
      requestId: true,
      dependsOn: { select: { dependsOnTask: { select: { status: true } } } },
    },
  });

  if (!canTransitionStatus(status, existing.dependsOn.map((d) => d.dependsOnTask))) {
    throw new DependencyError("dependencyBlocked");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    select: { id: true, projectId: true, requestId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
    entityType: "Task",
    entityId: task.id,
    projectId: task.projectId,
    metadata: { status },
  });

  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}/tasks`);
  revalidatePath(`/tasks/${task.id}`);
  if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
}

export async function updateTaskAction(
  taskId: string,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "tasks.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  // Edit only ever touches this subset — project/request/assignee/
  // dependencies have their own dedicated actions (reassignTaskAction,
  // addTaskDependencyAction, ...) and EditTaskDialog never submits them, so
  // requiring them here would fail validation on a field that isn't there.
  const result = taskSchema
    .omit({ projectId: true, requestId: true, assigneeId: true, dependsOnTaskIds: true })
    .safeParse({
      scopeItemId: formData.get("scopeItemId") || undefined,
      departmentId: formData.get("departmentId") || undefined,
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      notes: formData.get("notes") || undefined,
      priority: formData.get("priority"),
      estimatedHours: formData.get("estimatedHours") || undefined,
      actualHours: formData.get("actualHours") || undefined,
      startDate: formData.get("startDate") || undefined,
      dueDate: formData.get("dueDate") || undefined,
    });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;
  const clientVisible = formData.get("clientVisible") === "on";

  const previous = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: { dueDate: true, projectId: true, requestId: true },
  });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      scopeItemId: data.scopeItemId || null,
      departmentId: data.departmentId || null,
      title: data.title,
      description: data.description || null,
      notes: data.notes || null,
      priority: data.priority,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientVisible,
    },
    select: { id: true, projectId: true, requestId: true, dueDate: true },
  });

  const deadlineChanged = previous.dueDate?.getTime() !== task.dueDate?.getTime();
  await recordAudit({
    actorId: user.id,
    action: deadlineChanged ? "TASK_DEADLINE_CHANGED" : "TASK_UPDATED",
    entityType: "Task",
    entityId: task.id,
    projectId: task.projectId,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);
  revalidatePath(`/projects/${task.projectId}/tasks`);
  if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
}

export type ReassignTaskState = { formError?: string; warning?: string } | undefined;

export async function reassignTaskAction(
  taskId: string,
  assigneeId: string | null,
): Promise<ReassignTaskState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "tasks.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const previous = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: { assigneeId: true, title: true, projectId: true, requestId: true },
  });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    select: { id: true, title: true, projectId: true, requestId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: previous.assigneeId ? "TASK_REASSIGNED" : "TASK_ASSIGNED",
    entityType: "Task",
    entityId: task.id,
    projectId: task.projectId,
  });

  let warning: string | undefined;
  if (assigneeId) {
    const activeCount = await activeTaskCountFor(assigneeId, taskId);
    if (isOverloaded(activeCount)) warning = "overloaded";
    await notifyUser(assigneeId, {
      type: previous.assigneeId ? "TASK_REASSIGNED" : "TASK_ASSIGNED",
      title: task.title,
      link: `/tasks/${task.id}`,
    });
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);
  revalidatePath(`/projects/${task.projectId}/tasks`);
  if (task.requestId) revalidatePath(`/requests/${task.requestId}`);

  return warning ? { warning } : undefined;
}

export type DeleteTaskState = { formError?: string } | undefined;

export async function deleteTaskAction(
  taskId: string,
  _prevState: DeleteTaskState,
  _formData: FormData,
): Promise<DeleteTaskState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "tasks.delete");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  // "hasDependencies" is the shared code ConfirmDeleteDialog special-cases
  // for every delete action in this app (see confirm-delete-dialog.tsx) —
  // reused here even though the direction is inverted (other tasks depend
  // ON this one, rather than this one having dependents of its own).
  const dependentCount = await prisma.taskDependency.count({ where: { dependsOnTaskId: taskId } });
  if (dependentCount > 0) {
    return { formError: "hasDependencies" };
  }

  const task = await prisma.task.delete({
    where: { id: taskId },
    select: { projectId: true, requestId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "TASK_DELETED",
    entityType: "Task",
    entityId: taskId,
    projectId: task.projectId,
  });

  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}/tasks`);
  if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
}

export async function archiveTaskAction(taskId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "tasks.update");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: "ARCHIVED" },
    select: { projectId: true, requestId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "TASK_ARCHIVED",
    entityType: "Task",
    entityId: taskId,
    projectId: task.projectId,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/projects/${task.projectId}/tasks`);
  if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
}

export type DependencyActionState = { formError?: string } | undefined;

export async function addTaskDependencyAction(
  taskId: string,
  dependsOnTaskId: string,
): Promise<DependencyActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "tasks.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const [task, existingEdges] = await Promise.all([
    prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: { requestId: true } }),
    prisma.taskDependency.findMany({ select: { taskId: true, dependsOnTaskId: true } }),
  ]);
  const dependsOnTask = await prisma.task.findUniqueOrThrow({
    where: { id: dependsOnTaskId },
    select: { requestId: true },
  });
  if (task.requestId && dependsOnTask.requestId && task.requestId !== dependsOnTask.requestId) {
    return { formError: "forbidden" };
  }

  if (wouldCreateCycle(existingEdges, { taskId, dependsOnTaskId })) {
    return { formError: "cycleDetected" };
  }

  await prisma.taskDependency.upsert({
    where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
    update: {},
    create: { taskId, dependsOnTaskId },
  });

  await recordAudit({
    actorId: user.id,
    action: "TASK_DEPENDENCY_ADDED",
    entityType: "Task",
    entityId: taskId,
    metadata: { dependsOnTaskId },
  });

  revalidatePath(`/tasks/${taskId}`);
}

export async function removeTaskDependencyAction(
  taskId: string,
  dependsOnTaskId: string,
): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "tasks.update");

  await prisma.taskDependency.deleteMany({ where: { taskId, dependsOnTaskId } });

  await recordAudit({
    actorId: user.id,
    action: "TASK_DEPENDENCY_REMOVED",
    entityType: "Task",
    entityId: taskId,
    metadata: { dependsOnTaskId },
  });

  revalidatePath(`/tasks/${taskId}`);
}
