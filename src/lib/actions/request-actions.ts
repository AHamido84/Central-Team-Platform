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
import { notifyUser, notifyUsers } from "@/lib/notifications";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { zodFieldErrors } from "@/lib/form-utils";
import { fieldSetForCategory, collectRequestMetadata } from "@/lib/request-type-fields";
import { allTasksComplete } from "@/lib/request-progress";
import { validateFieldValues, visibleValuesOnly, type FieldDef } from "@/lib/dynamic-field-validation";
import { taskDraftListSchema } from "@/lib/validations/request-template";
import type { RequestStatus } from "@prisma/client";

export type CreateRequestState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

function readRequestFormData(formData: FormData) {
  return {
    projectId: formData.get("projectId") || undefined,
    scopeItemId: formData.get("scopeItemId") || undefined,
    campaignId: formData.get("campaignId") || undefined,
    requestTypeId: formData.get("requestTypeId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    notes: formData.get("notes") || undefined,
    priority: formData.get("priority") || undefined,
    requestedDate: formData.get("requestedDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  };
}

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

  const result = createRequestSchema.safeParse(readRequestFormData(formData));

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
      scopeItemId: data.scopeItemId || null,
      requestTypeId: data.requestTypeId,
      title: data.title,
      description: data.description || null,
      requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
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
    clientId,
  });

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { accountManagerId: true } });
  if (client?.accountManagerId) {
    await notifyUser(client.accountManagerId, {
      type: "REQUEST_CREATED",
      title: request.title,
      link: `/requests/${request.id}`,
    });
  }

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
    ...readRequestFormData(formData),
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
      scopeItemId: data.scopeItemId || null,
      campaignId: data.campaignId || null,
      requestTypeId: data.requestTypeId,
      title: data.title,
      description: data.description || null,
      notes: data.notes || null,
      priority: data.priority,
      requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
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
    clientId: data.clientId,
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

  if (status === "COMPLETED") {
    const tasks = await prisma.task.findMany({ where: { requestId }, select: { status: true } });
    if (!allTasksComplete(tasks)) {
      return { formError: "tasksIncomplete" };
    }
  }

  const request = await prisma.request.update({
    where: { id: requestId },
    data: { status },
    select: { id: true, projectId: true, clientId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_STATUS_UPDATED",
    entityType: "Request",
    entityId: request.id,
    projectId: request.projectId ?? undefined,
    clientId: request.clientId,
    metadata: { status },
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/portal/requests/${requestId}`);
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
    select: { id: true, title: true, projectId: true, clientId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_ASSIGNED",
    entityType: "Request",
    entityId: request.id,
    projectId: request.projectId ?? undefined,
    clientId: request.clientId,
  });

  if (assigneeId) {
    await notifyUser(assigneeId, {
      type: "REQUEST_ASSIGNED",
      title: request.title,
      link: `/requests/${request.id}`,
    });
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
}

export async function updateRequestAction(
  requestId: string,
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

  const result = createRequestSchema
    .omit({ requestTypeId: true })
    .safeParse(readRequestFormData(formData));
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const request = await prisma.request.update({
    where: { id: requestId },
    data: {
      scopeItemId: data.scopeItemId || null,
      campaignId: data.campaignId || null,
      title: data.title,
      description: data.description || null,
      notes: data.notes || null,
      priority: data.priority,
      requestedDate: data.requestedDate ? new Date(data.requestedDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    select: { id: true, projectId: true, clientId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_UPDATED",
    entityType: "Request",
    entityId: request.id,
    projectId: request.projectId ?? undefined,
    clientId: request.clientId,
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
}

export async function archiveRequestAction(requestId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "requests.update");

  const request = await prisma.request.update({
    where: { id: requestId },
    data: { status: "ARCHIVED" },
    select: { projectId: true, clientId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_ARCHIVED",
    entityType: "Request",
    entityId: requestId,
    projectId: request.projectId ?? undefined,
    clientId: request.clientId,
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
}

export type DeleteRequestState = { formError?: string } | undefined;

export async function deleteRequestAction(
  requestId: string,
  _prevState: DeleteRequestState,
  _formData: FormData,
): Promise<DeleteRequestState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "requests.delete");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const dependentTasks = await prisma.task.count({
    where: { requestId, status: { not: "CANCELLED" } },
  });
  if (dependentTasks > 0) {
    return { formError: "hasDependencies" };
  }

  const request = await prisma.request.delete({
    where: { id: requestId },
    select: { projectId: true, clientId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_DELETED",
    entityType: "Request",
    entityId: requestId,
    projectId: request.projectId ?? undefined,
    clientId: request.clientId,
  });

  revalidatePath("/requests");
  const locale = await getLocale();
  redirect({ href: "/requests", locale });
}

export async function sendForClientReviewAction(requestId: string): Promise<RequestActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "requests.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const tasks = await prisma.task.findMany({ where: { requestId }, select: { status: true } });
  if (!allTasksComplete(tasks)) {
    return { formError: "tasksIncomplete" };
  }

  const request = await prisma.request.update({
    where: { id: requestId },
    data: { status: "CLIENT_REVIEW" },
    select: { id: true, title: true, projectId: true, clientId: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_SENT_FOR_CLIENT_REVIEW",
    entityType: "Request",
    entityId: request.id,
    projectId: request.projectId ?? undefined,
    clientId: request.clientId,
  });

  const portalUsers = await prisma.user.findMany({
    where: { clientId: request.clientId },
    select: { id: true },
  });
  await notifyUsers(portalUsers.map((u) => u.id), {
    type: "REQUEST_SENT_FOR_CLIENT_REVIEW",
    title: request.title,
    link: `/portal/requests/${request.id}`,
  });

  revalidatePath("/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/portal/requests/${requestId}`);
}

/** Client-portal action: the client approves the completed work or asks for
 * changes. Reuses `deliverables.approve` — already the "client approves
 * agency work" permission — rather than adding a parallel one. */
export async function respondToClientReviewAction(
  requestId: string,
  decision: "APPROVE" | "REQUEST_CHANGES",
  comment: string,
): Promise<RequestActionState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "deliverables.approve");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const existing = await prisma.request.findUniqueOrThrow({
    where: { id: requestId },
    select: { status: true, clientId: true },
  });
  if (user.clientId !== existing.clientId) {
    return { formError: "forbidden" };
  }
  if (existing.status !== "CLIENT_REVIEW") {
    return { formError: "forbidden" };
  }
  if (decision === "REQUEST_CHANGES" && !comment.trim()) {
    return { formError: "commentRequired" };
  }

  const request = await prisma.request.update({
    where: { id: requestId },
    data: { status: decision === "APPROVE" ? "COMPLETED" : "CHANGES_REQUIRED" },
    select: { id: true, title: true, projectId: true, clientId: true, assignedToId: true, requestedById: true },
  });

  await recordAudit({
    actorId: user.id,
    action: decision === "APPROVE" ? "REQUEST_APPROVED" : "REQUEST_CHANGES_REQUESTED",
    entityType: "Request",
    entityId: request.id,
    projectId: request.projectId ?? undefined,
    clientId: request.clientId,
    metadata: comment ? { comment } : undefined,
  });

  await notifyUsers([request.assignedToId, request.requestedById], {
    type: decision === "APPROVE" ? "REQUEST_APPROVED" : "REQUEST_CHANGES_REQUESTED",
    title: request.title,
    message: comment || undefined,
    link: `/requests/${request.id}`,
  });

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/portal/requests/${requestId}`);
}

export type CreateFromTemplateState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
} | undefined;

type TemplateSubmission = {
  clientId: string;
  projectId: string;
  templateVersionId: string;
  title: string;
  description: string;
  requestedDate: string;
  dueDate: string;
  valuesJson: string;
  taskDraftsJson: string;
};

/**
 * Shared by the internal and portal wizards — the only difference between
 * them is *how* clientId is obtained (never trusted from the client for the
 * portal path). Implements the full spec §23/§56 chain in one transaction:
 * re-validates client/project/template server-side, re-fetches the
 * template version fresh (never trusts client-cached field definitions),
 * requires it to still be published, validates the dynamic field values,
 * then creates the Request + field values + tasks + dependencies together.
 */
type TemplateSubmissionResult =
  | { formError: string; fieldErrors?: undefined; redirectId?: undefined }
  | { fieldErrors: Record<string, string>; formError?: undefined; redirectId?: undefined }
  | { redirectId: string; formError?: undefined; fieldErrors?: undefined };

async function submitRequestFromTemplate(
  userId: string,
  submission: TemplateSubmission,
): Promise<TemplateSubmissionResult> {
  const version = await prisma.requestTemplateVersion.findUnique({
    where: { id: submission.templateVersionId },
    include: {
      template: { select: { id: true, isActive: true, isArchived: true, requestTypeId: true, currentVersionId: true } },
      sections: { include: { fields: { include: { options: true } } } },
    },
  });
  if (
    !version ||
    !version.isPublished ||
    !version.template.isActive ||
    version.template.isArchived ||
    version.template.currentVersionId !== version.id
  ) {
    return { formError: "invalidTemplate" };
  }

  const project = await prisma.project.findUnique({
    where: { id: submission.projectId },
    select: { clientId: true },
  });
  if (!project || project.clientId !== submission.clientId) {
    return { formError: "forbidden" };
  }

  const allFields: FieldDef[] = version.sections.flatMap((section) =>
    section.fields.map((field) => ({
      key: field.key,
      type: field.type,
      required: field.required,
      minValue: field.minValue?.toNumber() ?? null,
      maxValue: field.maxValue?.toNumber() ?? null,
      minLength: field.minLength,
      maxLength: field.maxLength,
      visibleIfFieldKey: field.visibleIfFieldKey,
      visibleIfValue: field.visibleIfValue,
      options: field.options,
    })),
  );
  const fieldByKey = new Map(
    version.sections.flatMap((s) => s.fields.map((f) => [f.key, f.id] as const)),
  );

  let values: Record<string, unknown>;
  try {
    values = JSON.parse(submission.valuesJson);
  } catch {
    return { formError: "invalidValues" };
  }
  const fieldErrors = validateFieldValues(allFields, values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }
  const storedValues = visibleValuesOnly(allFields, values);

  let taskDraftsRaw: unknown;
  try {
    taskDraftsRaw = JSON.parse(submission.taskDraftsJson);
  } catch {
    return { formError: "invalidTasks" };
  }
  const draftsResult = taskDraftListSchema.safeParse(taskDraftsRaw);
  const drafts = draftsResult.success ? draftsResult.data : [];

  const dueDate = submission.dueDate
    ? new Date(submission.dueDate)
    : version.defaultDurationDays != null
      ? new Date(Date.now() + version.defaultDurationDays * 24 * 60 * 60 * 1000)
      : null;

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.request.create({
      data: {
        clientId: submission.clientId,
        projectId: submission.projectId,
        requestTypeId: version.template.requestTypeId,
        templateVersionId: version.id,
        title: submission.title,
        description: submission.description || null,
        priority: version.defaultPriority,
        requestedDate: submission.requestedDate ? new Date(submission.requestedDate) : null,
        dueDate,
        requestedById: userId,
      },
    });

    for (const [key, value] of Object.entries(storedValues)) {
      const fieldId = fieldByKey.get(key);
      if (!fieldId) continue;
      await tx.requestFieldValue.create({ data: { requestId: request.id, fieldId, value: value as never } });
    }

    const keyToTaskId = new Map<string, string>();
    for (const draft of drafts) {
      const task = await tx.task.create({
        data: {
          projectId: submission.projectId,
          requestId: request.id,
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
      keyToTaskId.set(draft.key, task.id);
    }
    for (const draft of drafts) {
      const taskId = keyToTaskId.get(draft.key)!;
      const dependsOnIds = (draft.dependsOnKeys ?? [])
        .map((key) => keyToTaskId.get(key))
        .filter((depId): depId is string => Boolean(depId) && depId !== taskId);
      if (dependsOnIds.length > 0) {
        await tx.taskDependency.createMany({
          data: dependsOnIds.map((dependsOnTaskId) => ({ taskId, dependsOnTaskId })),
          skipDuplicates: true,
        });
      }
    }

    return request;
  });

  await recordAudit({
    actorId: userId,
    action: "REQUEST_CREATED",
    entityType: "Request",
    entityId: result.id,
    projectId: submission.projectId,
    clientId: submission.clientId,
    metadata: { templateVersionId: version.id, taskCount: drafts.length },
  });

  const client = await prisma.client.findUnique({
    where: { id: submission.clientId },
    select: { accountManagerId: true },
  });
  if (client?.accountManagerId) {
    await notifyUser(client.accountManagerId, {
      type: "REQUEST_CREATED",
      title: result.title,
      link: `/requests/${result.id}`,
    });
  }
  const assigneeIds = [...new Set(drafts.map((d) => d.assigneeId).filter((id): id is string => Boolean(id)))];
  await notifyUsers(assigneeIds, {
    type: "TASK_ASSIGNED",
    title: result.title,
    link: `/requests/${result.id}`,
  });

  revalidatePath("/requests");
  revalidatePath("/portal/requests");
  revalidatePath(`/projects/${submission.projectId}/requests`);

  return { redirectId: result.id };
}

function readTemplateSubmission(formData: FormData, clientId: string): TemplateSubmission {
  return {
    clientId,
    projectId: String(formData.get("projectId") || ""),
    templateVersionId: String(formData.get("templateVersionId") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    requestedDate: String(formData.get("requestedDate") || ""),
    dueDate: String(formData.get("dueDate") || ""),
    valuesJson: String(formData.get("valuesJson") || "{}"),
    taskDraftsJson: String(formData.get("taskDraftsJson") || "[]"),
  };
}

/** Internal staff creating a request from a template on behalf of a client
 * they explicitly choose (mirrors createInternalRequestAction vs
 * createRequestAction — the client id is only ever trusted from the
 * session on the portal path, never from form data). */
export async function createRequestFromTemplateAction(
  _prevState: CreateFromTemplateState,
  formData: FormData,
): Promise<CreateFromTemplateState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "requests.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }
  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { formError: "forbidden" };

  const result = await submitRequestFromTemplate(user.id, readTemplateSubmission(formData, clientId));
  if (result.redirectId) {
    const locale = await getLocale();
    redirect({ href: `/requests/${result.redirectId}`, locale });
  }
  return { formError: result.formError, fieldErrors: result.fieldErrors };
}

/** Client-portal path — clientId always comes from the session. */
export async function createPortalRequestFromTemplateAction(
  _prevState: CreateFromTemplateState,
  formData: FormData,
): Promise<CreateFromTemplateState> {
  const user = await requireUser();
  const clientId = user.clientId;
  if (!clientId) return { formError: "forbidden" };
  try {
    await requirePermission(user, "requests.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = await submitRequestFromTemplate(user.id, readTemplateSubmission(formData, clientId));
  if (result.redirectId) {
    const locale = await getLocale();
    redirect({ href: `/portal/requests/${result.redirectId}`, locale });
  }
  return { formError: result.formError, fieldErrors: result.fieldErrors };
}
