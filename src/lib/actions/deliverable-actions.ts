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

export type DeliverableActionState = { formError?: string } | undefined;

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
