"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { ACTIVE_TASK_STATUSES, isOverloaded } from "@/lib/task-capacity";
import {
  requestTemplateSchema,
  taskDraftListSchema,
} from "@/lib/validations/request-template";

export type TemplateFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createRequestTemplateAction(
  _prevState: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "settings.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("itemsJson") || "[]"));
  } catch {
    return { formError: "invalidItems" };
  }

  const result = requestTemplateSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    description: formData.get("description"),
    items: itemsRaw,
  });
  if (!result.success) {
    return { formError: "invalidItems" };
  }
  const data = result.data;

  const template = await prisma.requestTemplate.create({
    data: {
      name: data.name,
      category: data.category,
      description: data.description || null,
      items: {
        create: data.items.map((item) => ({
          order: item.order,
          title: item.title,
          description: item.description || null,
          departmentId: item.departmentId || null,
          defaultPriority: item.defaultPriority,
          defaultEstimatedHours: item.defaultEstimatedHours,
          dependsOnOrder: item.dependsOnOrder ?? null,
        })),
      },
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_CREATED",
    entityType: "RequestTemplate",
    entityId: template.id,
  });

  revalidatePath("/settings/templates");
}

export type GenerateTasksState = { formError?: string; warning?: boolean } | undefined;

/**
 * The "review & edit generated tasks" screen's submit — creates every draft
 * task (whether it came from a template or was hand-added) as one Task
 * decomposition, in a single transaction (spec §10/§18: unlimited tasks,
 * created safely). `key`s in the drafts resolve to real Task ids only after
 * insertion, so dependencies are added in a second pass within the same
 * transaction.
 */
export async function generateTasksFromTemplateAction(
  requestId: string,
  draftsJson: string,
): Promise<GenerateTasksState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "tasks.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  let draftsRaw: unknown;
  try {
    draftsRaw = JSON.parse(draftsJson);
  } catch {
    return { formError: "invalidItems" };
  }
  const result = taskDraftListSchema.safeParse(draftsRaw);
  if (!result.success) {
    return { formError: "invalidItems" };
  }
  const drafts = result.data;

  const request = await prisma.request.findUniqueOrThrow({
    where: { id: requestId },
    select: { projectId: true },
  });
  if (!request.projectId) {
    return { formError: "noProject" };
  }
  const projectId = request.projectId;

  const assigneeIds = [...new Set(drafts.map((d) => d.assigneeId).filter((id): id is string => Boolean(id)))];

  const createdIds = await prisma.$transaction(async (tx) => {
    const keyToId = new Map<string, string>();
    for (const draft of drafts) {
      const task = await tx.task.create({
        data: {
          projectId,
          requestId,
          departmentId: draft.departmentId || null,
          assigneeId: draft.assigneeId || null,
          title: draft.title,
          description: draft.description || null,
          priority: draft.priority,
          estimatedHours: draft.estimatedHours,
          startDate: draft.startDate ? new Date(draft.startDate) : null,
          dueDate: draft.dueDate ? new Date(draft.dueDate) : null,
        },
      });
      keyToId.set(draft.key, task.id);
    }
    for (const draft of drafts) {
      const taskId = keyToId.get(draft.key)!;
      const dependsOnIds = (draft.dependsOnKeys ?? [])
        .map((key) => keyToId.get(key))
        .filter((id): id is string => Boolean(id) && id !== taskId);
      if (dependsOnIds.length > 0) {
        await tx.taskDependency.createMany({
          data: dependsOnIds.map((dependsOnTaskId) => ({ taskId, dependsOnTaskId })),
          skipDuplicates: true,
        });
      }
    }
    return [...keyToId.values()];
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_APPLIED",
    entityType: "Request",
    entityId: requestId,
    projectId,
    metadata: { count: createdIds.length },
  });

  let warning = false;
  for (const assigneeId of assigneeIds) {
    const activeCount = await prisma.task.count({
      where: { assigneeId, status: { in: ACTIVE_TASK_STATUSES } },
    });
    if (isOverloaded(activeCount)) warning = true;
    await notifyUser(assigneeId, {
      type: "TASK_ASSIGNED",
      title: `${createdIds.length} tasks`,
      link: `/requests/${requestId}`,
    });
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/tasks");

  return warning ? { warning: true } : undefined;
}
