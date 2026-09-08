import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { RequestTemplateBuilder } from "@/components/settings/request-template-builder";
import type { TemplateDraftValues } from "@/lib/validations/request-template";

export default async function RequestTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("settings.requestTemplates");
  const tSettings = await getTranslations("settings");

  const template = await prisma.requestTemplate.findUnique({
    where: { id },
    select: { id: true, currentVersionId: true, requestTypeId: true, icon: true },
  });
  if (!template) notFound();

  const [draftVersion, requestTypes, departments] = await Promise.all([
    prisma.requestTemplateVersion.findFirst({
      where: { templateId: id, isPublished: false },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: { fields: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } },
        },
        tasks: { orderBy: { order: "asc" } },
      },
    }),
    prisma.requestType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!draftVersion) notFound();

  const initial: TemplateDraftValues = {
    basicInfo: {
      requestTypeId: template.requestTypeId,
      icon: template.icon ?? "",
      nameAr: draftVersion.nameAr,
      nameEn: draftVersion.nameEn,
      descriptionAr: draftVersion.descriptionAr ?? "",
      descriptionEn: draftVersion.descriptionEn ?? "",
      defaultPriority: draftVersion.defaultPriority,
      defaultDurationDays: draftVersion.defaultDurationDays,
    },
    sections: draftVersion.sections.map((section) => ({
      titleAr: section.titleAr,
      titleEn: section.titleEn,
      order: section.order,
      fields: section.fields.map((field) => ({
        key: field.key,
        labelAr: field.labelAr,
        labelEn: field.labelEn,
        description: field.description ?? undefined,
        placeholder: field.placeholder ?? undefined,
        type: field.type,
        required: field.required,
        order: field.order,
        defaultValue: field.defaultValue ?? undefined,
        minValue: field.minValue ? field.minValue.toNumber() : null,
        maxValue: field.maxValue ? field.maxValue.toNumber() : null,
        minLength: field.minLength,
        maxLength: field.maxLength,
        visibleIfFieldKey: field.visibleIfFieldKey,
        visibleIfValue: field.visibleIfValue,
        options: field.options.map((option) => ({
          labelAr: option.labelAr,
          labelEn: option.labelEn,
          value: option.value,
          order: option.order,
          isActive: option.isActive,
        })),
      })),
    })),
    tasks: draftVersion.tasks.map((task) => ({
      order: task.order,
      titleAr: task.titleAr,
      titleEn: task.titleEn,
      description: task.description ?? undefined,
      departmentId: task.departmentId,
      defaultPriority: task.defaultPriority,
      defaultEstimatedHours: task.defaultEstimatedHours ? task.defaultEstimatedHours.toNumber() : null,
      clientVisible: task.clientVisible,
      dependsOnOrder: task.dependsOnOrder,
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: tSettings("title"), href: "/settings" },
          { label: t("title"), href: "/settings/request-templates" },
          { label: draftVersion.nameAr || draftVersion.nameEn || t("newButton") },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{draftVersion.nameAr || t("newButton")}</h1>
        <p className="text-sm text-muted-foreground">{t("builderSubtitle", { version: draftVersion.version })}</p>
      </div>
      <RequestTemplateBuilder
        templateId={id}
        requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name }))}
        departments={departments.map((d) => ({ id: d.id, label: d.name }))}
        initial={initial}
        isPublished={Boolean(template.currentVersionId)}
      />
    </div>
  );
}
