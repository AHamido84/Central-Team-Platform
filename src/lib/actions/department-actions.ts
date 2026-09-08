"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";

const departmentSchema = z.object({
  name: z.string().trim().min(1, "required").max(100, "maxLength"),
});

export type DepartmentFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

export async function createDepartmentAction(
  _prevState: DepartmentFormState,
  formData: FormData,
): Promise<DepartmentFormState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "settings.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = departmentSchema.safeParse({ name: formData.get("name") });
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }

  const department = await prisma.department.create({
    data: { name: result.data.name, isCustom: true },
  });

  await recordAudit({
    actorId: user.id,
    action: "DEPARTMENT_CREATED",
    entityType: "Department",
    entityId: department.id,
  });

  revalidatePath("/settings");
  revalidatePath("/team");
}
