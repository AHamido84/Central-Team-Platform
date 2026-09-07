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
    projectTypeId: formData.get("projectTypeId"),
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
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
        projectTypeId: data.projectTypeId,
        name: data.name,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        ownerId: data.ownerId || null,
        accountManagerId: data.accountManagerId || null,
      },
    });
    await tx.projectScope.create({
      data: { projectId: created.id },
    });
    return created;
  });

  await recordAudit({
    actorId: user.id,
    action: "project.created",
    entityType: "Project",
    entityId: project.id,
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
      projectTypeId: data.projectTypeId,
      name: data.name,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      ownerId: data.ownerId || null,
      accountManagerId: data.accountManagerId || null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "project.updated",
    entityType: "Project",
    entityId: projectId,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  const locale = await getLocale();
  redirect({ href: `/projects/${projectId}`, locale });
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
    action: "scopeItem.created",
    entityType: "ProjectScope",
    entityId: projectScopeId,
  });

  revalidatePath(`/projects/${projectId}`);
}
