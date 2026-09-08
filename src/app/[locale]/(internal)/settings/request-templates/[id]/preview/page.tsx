import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { DynamicFormRenderer, type RenderSection } from "@/components/requests/dynamic-form-renderer";
import { pickLocalized } from "@/lib/dynamic-form-shared";

export default async function RequestTemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("settings.requestTemplates");
  const tSettings = await getTranslations("settings");
  const tPriority = await getTranslations("projects.priority");
  const tValidation = await getTranslations("validation");
  const locale = await getLocale();

  const template = await prisma.requestTemplate.findUnique({
    where: { id },
    include: { requestType: { select: { name: true } } },
  });
  if (!template) notFound();

  // Preview always shows the current draft (the spec's "preview before
  // publishing") — falls back to the published version if, for whatever
  // reason, no draft exists.
  const version = await prisma.requestTemplateVersion.findFirst({
    where: { templateId: id, isPublished: false },
    orderBy: { version: "desc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { fields: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } },
      },
      tasks: { orderBy: { order: "asc" }, include: { department: { select: { name: true } } } },
    },
  });
  if (!version) notFound();

  const sections: RenderSection[] = version.sections.map((section) => ({
    key: section.id,
    titleAr: section.titleAr,
    titleEn: section.titleEn,
    fields: section.fields.map((field) => ({
      key: field.key,
      labelAr: field.labelAr,
      labelEn: field.labelEn,
      description: field.description,
      placeholder: field.placeholder,
      type: field.type,
      required: field.required,
      defaultValue: field.defaultValue,
      options: field.options,
      visibleIfFieldKey: field.visibleIfFieldKey,
      visibleIfValue: field.visibleIfValue,
    })),
  }));

  const totalHours = version.tasks.reduce((sum, task) => sum + (task.defaultEstimatedHours?.toNumber() ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: tSettings("title"), href: "/settings" },
          { label: t("title"), href: "/settings/request-templates" },
          { label: t("preview") },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {template.icon ? `${template.icon} ` : ""}
            {pickLocalized(version.nameAr, version.nameEn, locale)}
          </h1>
          <p className="text-sm text-muted-foreground">{template.requestType.name}</p>
        </div>
        <Badge variant="secondary">{t("card.version", { version: version.version })}</Badge>
      </div>

      {(version.descriptionAr || version.descriptionEn) && (
        <p className="text-sm text-muted-foreground">
          {pickLocalized(version.descriptionAr ?? "", version.descriptionEn ?? "", locale)}
        </p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>{t("card.sections", { count: version.sections.length })}</span>
        <span>{t("card.fields", { count: version.sections.reduce((s, sec) => s + sec.fields.length, 0) })}</span>
        <span>{t("card.tasks", { count: version.tasks.length })}</span>
        <span>{t("fields.defaultPriority")}: {tPriority(version.defaultPriority)}</span>
        {totalHours > 0 && <span>{t("preview.totalHours", { hours: totalHours })}</span>}
      </div>

      <DynamicFormRenderer
        sections={sections}
        values={{}}
        onChange={() => {}}
        locale={locale}
        disabled
        errorLabel={(code) => tValidation(code as "required")}
      />

      {version.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("tasksTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border text-sm">
              {version.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{pickLocalized(task.titleAr, task.titleEn, locale)}</span>
                  <span className="text-xs text-muted-foreground">
                    {task.department?.name ?? "—"}
                    {task.dependsOnOrder != null && ` · ${t("preview.dependsOnOrder", { order: task.dependsOnOrder + 1 })}`}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
