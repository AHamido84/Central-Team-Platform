"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createRequestSchema } from "@/lib/validations/request";
import {
  requireUser,
  requirePermission,
  assertClientScope,
  ForbiddenError,
} from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { zodFieldErrors } from "@/lib/form-utils";
import { fieldSetForCategory, collectRequestMetadata } from "@/lib/request-type-fields";
import type { RequestStatus } from "@prisma/client";

export type CreateRequestState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createRequestAction(
  _prevState: CreateRequestState,
  formData: FormData,
): Promise<CreateRequestState> {
  const user = await requireUser();

  // Internal staff don't submit client requests through this form; only the
  // client's own clientId (from the session, never the request) is used.
  const clientId = user.clientId;
  if (!clientId) {
    return { formError: "forbidden" };
  }

  try {
    await requirePermission(user, "requests.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = createRequestSchema.safeParse({
    projectId: formData.get("projectId"),
    requestTypeId: formData.get("requestTypeId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  // If a project was selected, it must actually belong to this client — the
  // id came from a <select>, but we still re-check server-side.
  if (data.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { clientId: true },
    });
    if (!project) {
      return { formError: "forbidden" };
    }
    assertClientScope(user, project.clientId);
  }

  // The dynamic field set (dimensions/platform for design, duration/script
  // for video, ...) is derived from the request type's category server-side
  // — never trust which fields the client happened to submit.
  const requestType = await prisma.requestType.findUnique({
    where: { id: data.requestTypeId },
    select: { category: true },
  });
  const metadata = collectRequestMetadata(formData, fieldSetForCategory(requestType?.category));

  const request = await prisma.request.create({
    data: {
      clientId,
      projectId: data.projectId || null,
      requestTypeId: data.requestTypeId,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      metadata: metadata ?? undefined,
      requestedById: user.id,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_CREATED",
    entityType: "Request",
    entityId: request.id,
    projectId: data.projectId || undefined,
  });

  revalidatePath("/portal/requests");
  if (data.projectId) revalidatePath(`/portal/projects/${data.projectId}/requests`);
  const locale = await getLocale();
  redirect({ href: `/portal/requests/${request.id}`, locale });
}

const createInternalRequestSchema = createRequestSchema.extend({
  clientId: z.string().min(1, "required"),
});

/** Internal-side request creation: staff choose the client explicitly
 * (unlike the portal form, which derives it from the session). */
export async function createInternalRequestAction(
  _prevState: CreateRequestState,
  formData: FormData,
): Promise<CreateRequestState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "requests.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = createInternalRequestSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId"),
    requestTypeId: formData.get("requestTypeId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  if (data.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { clientId: true },
    });
    if (!project || project.clientId !== data.clientId) {
      return { formError: "forbidden" };
    }
  }

  const requestType = await prisma.requestType.findUnique({
    where: { id: data.requestTypeId },
    select: { category: true },
  });
  const metadata = collectRequestMetadata(formData, fieldSetForCategory(requestType?.category));

  const request = await prisma.request.create({
    data: {
      clientId: data.clientId,
      projectId: data.projectId || null,
      requestTypeId: data.requestTypeId,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      metadata: metadata ?? undefined,
      requestedById: user.id,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_CREATED",
    entityType: "Request",
    entityId: request.id,
    projectId: data.projectId || undefined,
  });

  revalidatePath("/requests");
  if (data.projectId) revalidatePath(`/projects/${data.projectId}/requests`);
  const locale = await getLocale();
  redirect({ href: `/requests/${request.id}`, locale });
}

export type RequestActionState = { formError?: string } | undefined;

export async function updateRequestStatusAction(
  requestId: string,
  status: RequestStatus,
): Promise<RequestActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "requests.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const request = await prisma.request.update({
    where: { id: requestId },
    data: { status },
    select: { id: true, projectId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_STATUS_UPDATED",
    entityType: "Request",
    entityId: request.id,
    projectId: request.projectId ?? undefined,
    metadata: { status },
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
}

export async function assignRequestAction(
  requestId: string,
  assigneeId: string | null,
): Promise<RequestActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "requests.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const request = await prisma.request.update({
    where: { id: requestId },
    data: { assignedToId: assigneeId },
    select: { id: true, projectId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_ASSIGNED",
    entityType: "Request",
    entityId: request.id,
    projectId: request.projectId ?? undefined,
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
}
