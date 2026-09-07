"use server";

import { revalidatePath } from "next/cache";
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

  const request = await prisma.request.create({
    data: {
      clientId,
      projectId: data.projectId || null,
      requestTypeId: data.requestTypeId,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
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
