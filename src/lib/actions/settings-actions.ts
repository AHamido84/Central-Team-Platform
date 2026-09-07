"use server";

import { revalidatePath } from "next/cache";
import {
  profileSchema,
  projectTypeSchema,
  requestTypeSchema,
} from "@/lib/validations/settings";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";

export type SettingsFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function updateProfileAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();

  const result = profileSchema.safeParse({
    name: formData.get("name"),
    locale: formData.get("locale"),
  });
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name, locale: data.locale },
  });

  revalidatePath("/settings");
}

export async function createProjectTypeAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "settings.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = projectTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const projectType = await prisma.projectType.create({
    data: { name: data.name, description: data.description || null, isCustom: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "PROJECT_TYPE_CREATED",
    entityType: "ProjectType",
    entityId: projectType.id,
  });

  revalidatePath("/settings");
}

export async function createRequestTypeAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "settings.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = requestTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category") || undefined,
  });
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const requestType = await prisma.requestType.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category || null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TYPE_CREATED",
    entityType: "RequestType",
    entityId: requestType.id,
  });

  revalidatePath("/settings");
}
