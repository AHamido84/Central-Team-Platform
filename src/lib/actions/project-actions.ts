"use server";

import { revalidatePath } from "next/cache";
import { projectSchema, scopeItemSchema } from "@/lib/validations/project";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { zodFieldErrors } from "@/lib/form-utils";

export type ProjectFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    clientId: formData.get("clientId"),
    contractId: formData.get("contractId"),
    projectTypeId: formData.get("projectTypeId"),
    name: formData.get("name"),
    projectCode: formData.get("projectCode"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    budget: formData.get("budget") || undefined,
    currency: formData.get("currency"),
    ownerId: formData.get("ownerId"),
    accountManagerId: formData.get("accountManagerId"),
  });
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "projects.create");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseProjectForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        clientId: data.clientId,
        contractId: data.contractId || null,
        projectTypeId: data.projectTypeId,
        name: data.name,
        projectCode: data.projectCode || null,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        budget: data.budget,
        currency: data.currency || "SAR",
        ownerId: data.ownerId || null,
        accountManagerId: data.accountManagerId || null,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    await tx.projectScope.create({
      data: { projectId: created.id },
    });
    return created;
  });

  await recordAudit({
    actorId: user.id,
    action: "PROJECT_CREATED",
    entityType: "Project",
    entityId: project.id,
    projectId: project.id,
    clientId: data.clientId,
  });

  revalidatePath("/projects");
  revalidatePath(`/clients/${data.clientId}`);
  const locale = await getLocale();
  redirect({ href: `/projects/${project.id}`, locale });
}

export async function updateProjectAction(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "projects.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = parseProjectForm(formData);
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      clientId: data.clientId,
      contractId: data.contractId || null,
      projectTypeId: data.projectTypeId,
      name: data.name,
      projectCode: data.projectCode || null,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      budget: data.budget,
      currency: data.currency || "SAR",
      ownerId: data.ownerId || null,
      accountManagerId: data.accountManagerId || null,
      updatedById: user.id,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "Project",
    entityId: projectId,
    projectId,
    clientId: data.clientId,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${data.clientId}`);
  const locale = await getLocale();
  redirect({ href: `/projects/${projectId}`, locale });
}

export async function archiveProjectAction(projectId: string, clientId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "projects.update");

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ARCHIVED", updatedById: user.id },
  });

  await recordAudit({
    actorId: user.id,
    action: "PROJECT_ARCHIVED",
    entityType: "Project",
    entityId: projectId,
    projectId,
    clientId,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
}

export type DeleteProjectState = { formError?: string } | undefined;

export async function deleteProjectAction(
  projectId: string,
  clientId: string,
  _prevState: DeleteProjectState,
  _formData: FormData,
): Promise<DeleteProjectState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "projects.delete");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const [taskCount, deliverableCount, requestCount] = await Promise.all([
    prisma.task.count({ where: { projectId } }),
    prisma.deliverable.count({ where: { projectId } }),
    prisma.request.count({ where: { projectId } }),
  ]);
  if (taskCount + deliverableCount + requestCount > 0) {
    return { formError: "hasDependencies" };
  }

  await prisma.project.delete({ where: { id: projectId } });

  await recordAudit({
    actorId: user.id,
    action: "PROJECT_DELETED",
    entityType: "Project",
    entityId: projectId,
    clientId,
  });

  revalidatePath("/projects");
  revalidatePath(`/clients/${clientId}`);
  const locale = await getLocale();
  redirect({ href: "/projects", locale });
}

export type ScopeItemFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function addScopeItemAction(
  projectScopeId: string,
  projectId: string,
  _prevState: ScopeItemFormState,
  formData: FormData,
): Promise<ScopeItemFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "projects.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = scopeItemSchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    description: formData.get("description"),
    quantity: formData.get("quantity") || undefined,
    unit: formData.get("unit"),
    estimatedHours: formData.get("estimatedHours") || undefined,
    dueDate: formData.get("dueDate"),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.scopeItem.create({
    data: {
      projectScopeId,
      category: data.category,
      name: data.name,
      description: data.description || null,
      quantity: data.quantity,
      unit: data.unit || null,
      estimatedHours: data.estimatedHours,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "SCOPE_ITEM_CREATED",
    entityType: "ProjectScope",
    entityId: projectScopeId,
    projectId,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function updateScopeItemAction(
  scopeItemId: string,
  projectId: string,
  _prevState: ScopeItemFormState,
  formData: FormData,
): Promise<ScopeItemFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "projects.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = scopeItemSchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    quantity: formData.get("quantity") || undefined,
    unit: formData.get("unit"),
    estimatedHours: formData.get("estimatedHours") || undefined,
    progressMode: formData.get("progressMode") || undefined,
    manualProgressPercent: formData.get("manualProgressPercent") || undefined,
    weight: formData.get("weight") || undefined,
    dueDate: formData.get("dueDate"),
  });

  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.scopeItem.update({
    where: { id: scopeItemId },
    data: {
      category: data.category,
      name: data.name,
      description: data.description || null,
      quantity: data.quantity,
      unit: data.unit || null,
      estimatedHours: data.estimatedHours,
      progressMode: data.progressMode ?? "QUANTITY",
      manualProgressPercent: data.progressMode === "MANUAL" ? (data.manualProgressPercent ?? 0) : null,
      weight: data.progressMode === "WEIGHTED" ? data.weight : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "SCOPE_ITEM_UPDATED",
    entityType: "ScopeItem",
    entityId: scopeItemId,
    projectId,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/scope`);
}

export type DeleteScopeItemState = { formError?: string } | undefined;

export async function deleteScopeItemAction(
  scopeItemId: string,
  projectId: string,
  _prevState: DeleteScopeItemState,
  _formData: FormData,
): Promise<DeleteScopeItemState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "projects.update");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const dependentTaskCount = await prisma.task.count({ where: { scopeItemId } });
  if (dependentTaskCount > 0) {
    return { formError: "hasDependencies" };
  }

  await prisma.scopeItem.delete({ where: { id: scopeItemId } });

  await recordAudit({
    actorId: user.id,
    action: "SCOPE_ITEM_DELETED",
    entityType: "ScopeItem",
    entityId: scopeItemId,
    projectId,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/scope`);
}
