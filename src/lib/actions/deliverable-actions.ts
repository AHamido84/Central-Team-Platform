"use server";

import { revalidatePath } from "next/cache";
import {
  requireUser,
  requirePermission,
  assertClientScope,
  ForbiddenError,
} from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { deliverableSchema } from "@/lib/validations/deliverable";
import { zodFieldErrors } from "@/lib/form-utils";

export type DeliverableActionState = { formError?: string } | undefined;

export type DeliverableFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

/** Internal-side upload: either a brand-new Deliverable, or — when
 * `supersedesId` is set — a new version row linked back to the one it
 * replaces (see Deliverable.supersedesId in schema.prisma). The old row is
 * never overwritten, so the full v1/v2/v3 history stays queryable. */
export async function createDeliverableAction(
  _prevState: DeliverableFormState,
  formData: FormData,
): Promise<DeliverableFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "deliverables.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = deliverableSchema.safeParse({
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category") || undefined,
    type: formData.get("type"),
    dueDate: formData.get("dueDate"),
    fileName: formData.get("fileName"),
    fileUrl: formData.get("fileUrl"),
    supersedesId: formData.get("supersedesId") || undefined,
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  let version = 1;
  if (data.supersedesId) {
    const previous = await prisma.deliverable.findUnique({
      where: { id: data.supersedesId },
      select: { version: true, projectId: true },
    });
    if (!previous || previous.projectId !== data.projectId) {
      return { formError: "forbidden" };
    }
    version = previous.version + 1;
  }

  const deliverable = await prisma.$transaction(async (tx) => {
    const created = await tx.deliverable.create({
      data: {
        projectId: data.projectId,
        taskId: data.taskId || null,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        type: data.type || null,
        status: "DRAFT",
        version,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        supersedesId: data.supersedesId || null,
      },
    });
    await tx.asset.create({
      data: {
        deliverableId: created.id,
        projectId: data.projectId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        uploadedById: user.id,
      },
    });
    return created;
  });

  await recordAudit({
    actorId: user.id,
    action: data.supersedesId ? "DELIVERABLE_VERSION_UPLOADED" : "DELIVERABLE_UPLOADED",
    entityType: "Deliverable",
    entityId: deliverable.id,
    projectId: data.projectId,
  });

  revalidatePath("/deliverables");
  revalidatePath(`/projects/${data.projectId}/deliverables`);
}

async function loadDeliverableForClient(deliverableId: string) {
  return prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, projectId: true, project: { select: { clientId: true } } },
  });
}

export async function approveDeliverableAction(
  deliverableId: string,
): Promise<DeliverableActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "deliverables.approve");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const deliverable = await loadDeliverableForClient(deliverableId);
  if (!deliverable) return { formError: "forbidden" };
  assertClientScope(user, deliverable.project.clientId);

  await prisma.$transaction([
    prisma.deliverable.update({
      where: { id: deliverableId },
      data: { status: "APPROVED" },
    }),
    prisma.approval.create({
      data: {
        entityType: "DELIVERABLE",
        entityId: deliverableId,
        status: "APPROVED",
        approverId: user.id,
        decidedAt: new Date(),
      },
    }),
  ]);

  await recordAudit({
    actorId: user.id,
    action: "DELIVERABLE_APPROVED",
    entityType: "Deliverable",
    entityId: deliverableId,
    projectId: deliverable.projectId,
  });

  revalidatePath("/portal/deliverables");
  revalidatePath(`/portal/projects/${deliverable.projectId}/deliverables`);
  revalidatePath(`/portal/deliverables/${deliverableId}`);
}

export async function requestDeliverableChangesAction(
  deliverableId: string,
  _prevState: DeliverableActionState,
  formData: FormData,
): Promise<DeliverableActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "deliverables.approve");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const deliverable = await loadDeliverableForClient(deliverableId);
  if (!deliverable) return { formError: "forbidden" };
  assertClientScope(user, deliverable.project.clientId);

  const comment = formData.get("comment");
  const commentText = typeof comment === "string" && comment.trim() ? comment.trim() : null;

  await prisma.$transaction([
    prisma.deliverable.update({
      where: { id: deliverableId },
      data: { status: "REJECTED" },
    }),
    prisma.approval.create({
      data: {
        entityType: "DELIVERABLE",
        entityId: deliverableId,
        status: "REJECTED",
        approverId: user.id,
        comment: commentText,
        decidedAt: new Date(),
      },
    }),
  ]);

  await recordAudit({
    actorId: user.id,
    action: "DELIVERABLE_CHANGES_REQUESTED",
    entityType: "Deliverable",
    entityId: deliverableId,
    projectId: deliverable.projectId,
    metadata: commentText ? { comment: commentText } : undefined,
  });

  revalidatePath("/portal/deliverables");
  revalidatePath(`/portal/projects/${deliverable.projectId}/deliverables`);
  revalidatePath(`/portal/deliverables/${deliverableId}`);
}
