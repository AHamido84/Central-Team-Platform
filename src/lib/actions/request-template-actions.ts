"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requirePermission, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { ACTIVE_TASK_STATUSES, isOverloaded } from "@/lib/task-capacity";
import {
  templateBasicInfoSchema,
  templateDraftSchema,
  taskDraftListSchema,
  type TemplateDraftValues,
} from "@/lib/validations/request-template";
import { zodFieldErrors } from "@/lib/form-utils";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export type TemplateFormState = {
  errors?: Record<string, string>;
  formError?: string;
} | undefined;

/** Cross-field checks zod can't express on its own: field keys unique
 * across the whole draft (visibility rules reference them regardless of
 * section), visibleIfFieldKey pointing at a real field, dependsOnOrder
 * pointing at a real task in the same draft. */
function validateDraftIntegrity(draft: TemplateDraftValues): string | null {
  const allKeys = new Set<string>();
  for (const section of draft.sections) {
    for (const field of section.fields) {
      if (allKeys.has(field.key)) return "duplicateFieldKey";
      allKeys.add(field.key);
    }
  }
  for (const section of draft.sections) {
    for (const field of section.fields) {
      if (field.visibleIfFieldKey && !allKeys.has(field.visibleIfFieldKey)) {
        return "invalidConditionalField";
      }
    }
  }
  const taskOrders = new Set(draft.tasks.map((t) => t.order));
  for (const task of draft.tasks) {
    if (task.dependsOnOrder != null && !taskOrders.has(task.dependsOnOrder)) {
      return "invalidTaskDependency";
    }
  }
  return null;
}

async function requireTemplatePermission() {
  const user = await requireUser();
  await requirePermission(user, "settings.templates.manage");
  return user;
}

export async function createTemplateAction(
  _prevState: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  let user;
  try {
    user = await requireTemplatePermission();
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const result = templateBasicInfoSchema
    .pick({ requestTypeId: true, nameAr: true, nameEn: true })
    .safeParse({
      requestTypeId: formData.get("requestTypeId"),
      nameAr: formData.get("nameAr"),
      nameEn: formData.get("nameEn"),
    });
  if (!result.success) {
    return { errors: zodFieldErrors(result) };
  }
  const data = result.data;

  const template = await prisma.requestTemplate.create({
    data: {
      requestTypeId: data.requestTypeId,
      createdById: user.id,
      versions: {
        create: {
          version: 1,
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          sections: {
            create: [{ titleAr: "معلومات أساسية", titleEn: "Basic information", order: 0 }],
          },
        },
      },
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_CREATED",
    entityType: "RequestTemplate",
    entityId: template.id,
  });

  revalidatePath("/settings/request-templates");
  const locale = await getLocale();
  redirect({ href: `/settings/request-templates/${template.id}`, locale });
}

/** Finds the template's single unpublished draft version — every template
 * has exactly one at all times (created alongside the template, and a
 * fresh one is opened immediately after every publish). */
async function getDraftVersion(templateId: string) {
  return prisma.requestTemplateVersion.findFirst({
    where: { templateId, isPublished: false },
    orderBy: { version: "desc" },
  });
}

export async function saveTemplateDraftAction(
  templateId: string,
  draftJson: string,
): Promise<TemplateFormState> {
  let user;
  try {
    user = await requireTemplatePermission();
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(draftJson);
  } catch {
    return { formError: "invalidDraft" };
  }
  const result = templateDraftSchema.safeParse(raw);
  if (!result.success) {
    return { formError: "invalidDraft" };
  }
  const draft = result.data;
  const integrityError = validateDraftIntegrity(draft);
  if (integrityError) {
    return { formError: integrityError };
  }

  const draftVersion = await getDraftVersion(templateId);
  if (!draftVersion) {
    return { formError: "noDraftVersion" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.requestTemplate.update({
      where: { id: templateId },
      data: { requestTypeId: draft.basicInfo.requestTypeId, icon: draft.basicInfo.icon || null },
    });
    await tx.requestTemplateVersion.update({
      where: { id: draftVersion.id },
      data: {
        nameAr: draft.basicInfo.nameAr,
        nameEn: draft.basicInfo.nameEn,
        descriptionAr: draft.basicInfo.descriptionAr || null,
        descriptionEn: draft.basicInfo.descriptionEn || null,
        defaultPriority: draft.basicInfo.defaultPriority,
        defaultDurationDays: draft.basicInfo.defaultDurationDays,
      },
    });

    // Whole-array resubmit, same convention as every other builder in this
    // app (scope items, Phase 3's task templates) — simpler and safer than
    // diffing against a nested tree, and this only ever touches the
    // unpublished draft version, never a published (immutable) one.
    await tx.requestTemplateSection.deleteMany({ where: { versionId: draftVersion.id } });
    await tx.requestTemplateTask.deleteMany({ where: { versionId: draftVersion.id } });

    for (const section of draft.sections) {
      const createdSection = await tx.requestTemplateSection.create({
        data: {
          versionId: draftVersion.id,
          titleAr: section.titleAr,
          titleEn: section.titleEn,
          order: section.order,
        },
      });
      for (const field of section.fields) {
        const createdField = await tx.requestTemplateField.create({
          data: {
            versionId: draftVersion.id,
            sectionId: createdSection.id,
            key: field.key,
            labelAr: field.labelAr,
            labelEn: field.labelEn,
            description: field.description || null,
            placeholder: field.placeholder || null,
            type: field.type,
            required: field.required,
            order: field.order,
            defaultValue: field.defaultValue || null,
            minValue: field.minValue ?? null,
            maxValue: field.maxValue ?? null,
            minLength: field.minLength ?? null,
            maxLength: field.maxLength ?? null,
            visibleIfFieldKey: field.visibleIfFieldKey || null,
            visibleIfValue: field.visibleIfValue || null,
          },
        });
        if (field.options && field.options.length > 0) {
          await tx.requestTemplateFieldOption.createMany({
            data: field.options.map((option) => ({
              fieldId: createdField.id,
              labelAr: option.labelAr,
              labelEn: option.labelEn,
              value: option.value,
              order: option.order,
              isActive: option.isActive,
            })),
          });
        }
      }
    }

    if (draft.tasks.length > 0) {
      await tx.requestTemplateTask.createMany({
        data: draft.tasks.map((task) => ({
          versionId: draftVersion.id,
          order: task.order,
          titleAr: task.titleAr,
          titleEn: task.titleEn,
          description: task.description || null,
          departmentId: task.departmentId || null,
          defaultPriority: task.defaultPriority,
          defaultEstimatedHours: task.defaultEstimatedHours,
          clientVisible: task.clientVisible,
          dependsOnOrder: task.dependsOnOrder ?? null,
        })),
      });
    }
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_UPDATED",
    entityType: "RequestTemplate",
    entityId: templateId,
  });

  revalidatePath(`/settings/request-templates/${templateId}`);
}

export async function publishTemplateAction(templateId: string): Promise<TemplateFormState> {
  let user;
  try {
    user = await requireTemplatePermission();
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const draftVersion = await prisma.requestTemplateVersion.findFirst({
    where: { templateId, isPublished: false },
    include: {
      sections: { include: { fields: { include: { options: true } } } },
      tasks: true,
    },
  });
  if (!draftVersion) {
    return { formError: "noDraftVersion" };
  }
  if (draftVersion.sections.length === 0) {
    return { formError: "noSections" };
  }

  const nextVersionNumber = draftVersion.version + 1;

  await prisma.$transaction(async (tx) => {
    await tx.requestTemplateVersion.update({
      where: { id: draftVersion.id },
      data: { isPublished: true, publishedAt: new Date() },
    });
    await tx.requestTemplate.update({
      where: { id: templateId },
      data: { currentVersionId: draftVersion.id },
    });

    // Immediately clone the just-published version into a fresh draft, so
    // the builder always has something unpublished to keep editing without
    // ever mutating the version any existing Request points at.
    const newDraft = await tx.requestTemplateVersion.create({
      data: {
        templateId,
        version: nextVersionNumber,
        nameAr: draftVersion.nameAr,
        nameEn: draftVersion.nameEn,
        descriptionAr: draftVersion.descriptionAr,
        descriptionEn: draftVersion.descriptionEn,
        defaultPriority: draftVersion.defaultPriority,
        defaultDurationDays: draftVersion.defaultDurationDays,
      },
    });
    for (const section of draftVersion.sections) {
      const newSection = await tx.requestTemplateSection.create({
        data: {
          versionId: newDraft.id,
          titleAr: section.titleAr,
          titleEn: section.titleEn,
          order: section.order,
        },
      });
      for (const field of section.fields) {
        const newField = await tx.requestTemplateField.create({
          data: {
            versionId: newDraft.id,
            sectionId: newSection.id,
            key: field.key,
            labelAr: field.labelAr,
            labelEn: field.labelEn,
            description: field.description,
            placeholder: field.placeholder,
            type: field.type,
            required: field.required,
            order: field.order,
            defaultValue: field.defaultValue,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            visibleIfFieldKey: field.visibleIfFieldKey,
            visibleIfValue: field.visibleIfValue,
          },
        });
        if (field.options.length > 0) {
          await tx.requestTemplateFieldOption.createMany({
            data: field.options.map((option) => ({
              fieldId: newField.id,
              labelAr: option.labelAr,
              labelEn: option.labelEn,
              value: option.value,
              order: option.order,
              isActive: option.isActive,
            })),
          });
        }
      }
    }
    if (draftVersion.tasks.length > 0) {
      await tx.requestTemplateTask.createMany({
        data: draftVersion.tasks.map((task) => ({
          versionId: newDraft.id,
          order: task.order,
          titleAr: task.titleAr,
          titleEn: task.titleEn,
          description: task.description,
          departmentId: task.departmentId,
          defaultPriority: task.defaultPriority,
          defaultEstimatedHours: task.defaultEstimatedHours,
          clientVisible: task.clientVisible,
          dependsOnOrder: task.dependsOnOrder,
        })),
      });
    }
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_PUBLISHED",
    entityType: "RequestTemplate",
    entityId: templateId,
    metadata: { version: draftVersion.version },
  });

  revalidatePath("/settings/request-templates");
  revalidatePath(`/settings/request-templates/${templateId}`);
}

export async function duplicateTemplateAction(templateId: string): Promise<TemplateFormState> {
  let user;
  try {
    user = await requireTemplatePermission();
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const source = await prisma.requestTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: {
      currentVersion: {
        include: { sections: { include: { fields: { include: { options: true } } } }, tasks: true },
      },
      versions: {
        where: { isPublished: false },
        include: { sections: { include: { fields: { include: { options: true } } } }, tasks: true },
        take: 1,
      },
    },
  });
  const base = source.currentVersion ?? source.versions[0];
  if (!base) {
    return { formError: "noDraftVersion" };
  }

  const duplicate = await prisma.$transaction(async (tx) => {
    const newTemplate = await tx.requestTemplate.create({
      data: {
        requestTypeId: source.requestTypeId,
        icon: source.icon,
        createdById: user.id,
      },
    });
    const newVersion = await tx.requestTemplateVersion.create({
      data: {
        templateId: newTemplate.id,
        version: 1,
        nameAr: `${base.nameAr} (نسخة)`,
        nameEn: `${base.nameEn} (Copy)`,
        descriptionAr: base.descriptionAr,
        descriptionEn: base.descriptionEn,
        defaultPriority: base.defaultPriority,
        defaultDurationDays: base.defaultDurationDays,
      },
    });
    for (const section of base.sections) {
      const newSection = await tx.requestTemplateSection.create({
        data: {
          versionId: newVersion.id,
          titleAr: section.titleAr,
          titleEn: section.titleEn,
          order: section.order,
        },
      });
      for (const field of section.fields) {
        const newField = await tx.requestTemplateField.create({
          data: {
            versionId: newVersion.id,
            sectionId: newSection.id,
            key: field.key,
            labelAr: field.labelAr,
            labelEn: field.labelEn,
            description: field.description,
            placeholder: field.placeholder,
            type: field.type,
            required: field.required,
            order: field.order,
            defaultValue: field.defaultValue,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            visibleIfFieldKey: field.visibleIfFieldKey,
            visibleIfValue: field.visibleIfValue,
          },
        });
        if (field.options.length > 0) {
          await tx.requestTemplateFieldOption.createMany({
            data: field.options.map((option) => ({
              fieldId: newField.id,
              labelAr: option.labelAr,
              labelEn: option.labelEn,
              value: option.value,
              order: option.order,
              isActive: option.isActive,
            })),
          });
        }
      }
    }
    if (base.tasks.length > 0) {
      await tx.requestTemplateTask.createMany({
        data: base.tasks.map((task) => ({
          versionId: newVersion.id,
          order: task.order,
          titleAr: task.titleAr,
          titleEn: task.titleEn,
          description: task.description,
          departmentId: task.departmentId,
          defaultPriority: task.defaultPriority,
          defaultEstimatedHours: task.defaultEstimatedHours,
          clientVisible: task.clientVisible,
          dependsOnOrder: task.dependsOnOrder,
        })),
      });
    }
    return newTemplate;
  });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_DUPLICATED",
    entityType: "RequestTemplate",
    entityId: duplicate.id,
    metadata: { sourceTemplateId: templateId },
  });

  revalidatePath("/settings/request-templates");
  const locale = await getLocale();
  redirect({ href: `/settings/request-templates/${duplicate.id}`, locale });
}

export async function archiveTemplateAction(templateId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "settings.templates.manage");

  await prisma.requestTemplate.update({ where: { id: templateId }, data: { isArchived: true } });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_ARCHIVED",
    entityType: "RequestTemplate",
    entityId: templateId,
  });

  revalidatePath("/settings/request-templates");
}

export async function restoreTemplateAction(templateId: string): Promise<void> {
  const user = await requireUser();
  await requirePermission(user, "settings.templates.manage");

  await prisma.requestTemplate.update({ where: { id: templateId }, data: { isArchived: false } });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_RESTORED",
    entityType: "RequestTemplate",
    entityId: templateId,
  });

  revalidatePath("/settings/request-templates");
}

export type DeleteTemplateState = { formError?: string } | undefined;

export async function deleteTemplateAction(
  templateId: string,
  _prevState: DeleteTemplateState,
  _formData: FormData,
): Promise<DeleteTemplateState> {
  const user = await requireUser();
  try {
    await requirePermission(user, "settings.templates.manage");
  } catch (error) {
    if (error instanceof ForbiddenError) return { formError: "forbidden" };
    throw error;
  }

  const usageCount = await prisma.request.count({
    where: { templateVersion: { templateId } },
  });
  if (usageCount > 0) {
    return { formError: "hasDependencies" };
  }

  await prisma.requestTemplate.delete({ where: { id: templateId } });

  await recordAudit({
    actorId: user.id,
    action: "REQUEST_TEMPLATE_DELETED",
    entityType: "RequestTemplate",
    entityId: templateId,
  });

  revalidatePath("/settings/request-templates");
  const locale = await getLocale();
  redirect({ href: "/settings/request-templates", locale });
}

export type GenerateTasksState = { formError?: string; warning?: boolean } | undefined;

/**
 * Phase 3's "apply a template to an existing request after the fact" flow —
 * still useful alongside the Phase 2.5 upfront template-selection wizard,
 * so it's kept, just fed by whichever page built the draft array (now the
 * page reads `template.currentVersion.tasks` instead of the old flat
 * `template.items`).
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
