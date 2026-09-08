import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { RequestForm } from "@/components/portal/request-form";
import { TemplateRequestWizard } from "@/components/requests/template-request-wizard";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; mode?: string }>;
}) {
  const user = await requireUser();
  const { projectId, mode } = await searchParams;
  const useTemplate = mode === "template";
  const t = await getTranslations("requests");

  const clientId = user.clientId;
  const [projects, requestTypes, templates] = await Promise.all([
    clientId
      ? prisma.project.findMany({
          where: { clientId },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
    prisma.requestType.findMany({ orderBy: { name: "asc" } }),
    useTemplate
      ? prisma.requestTemplate.findMany({
          where: { isActive: true, isArchived: false, currentVersionId: { not: null } },
          include: {
            currentVersion: {
              include: {
                sections: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } } },
                tasks: { orderBy: { order: "asc" } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("createTitle")}</h1>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          <Button size="sm" variant={!useTemplate ? "secondary" : "ghost"} render={<Link href="/portal/requests/new">{t("wizard.customRequest")}</Link>} />
          <Button size="sm" variant={useTemplate ? "secondary" : "ghost"} render={<Link href="/portal/requests/new?mode=template">{t("wizard.fromTemplate")}</Link>} />
        </div>
      </div>
      {useTemplate ? (
        <TemplateRequestWizard
          isPortal
          projects={projects.map((p) => ({ id: p.id, label: p.name, clientId: clientId ?? "" }))}
          requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name }))}
          departments={[]}
          assignees={[]}
          defaultClientId={clientId ?? undefined}
          templates={templates
            .filter((tpl) => tpl.currentVersion)
            .map((tpl) => ({
              id: tpl.id,
              requestTypeId: tpl.requestTypeId,
              icon: tpl.icon,
              versionId: tpl.currentVersion!.id,
              nameAr: tpl.currentVersion!.nameAr,
              nameEn: tpl.currentVersion!.nameEn,
              descriptionAr: tpl.currentVersion!.descriptionAr,
              descriptionEn: tpl.currentVersion!.descriptionEn,
              defaultPriority: tpl.currentVersion!.defaultPriority,
              defaultDurationDays: tpl.currentVersion!.defaultDurationDays,
              sections: tpl.currentVersion!.sections.map((section) => ({
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
              })),
              // Client Portal visibility rule (spec §16, Phase 3): the
              // client-facing wizard doesn't need departments/assignees, so
              // task rows are collapsed to title/description only here —
              // the internal wizard is where staff assign department/owner.
              tasks: tpl.currentVersion!.tasks.map((task) => ({
                order: task.order,
                titleAr: task.titleAr,
                titleEn: task.titleEn,
                description: task.description,
                departmentId: task.departmentId,
                defaultPriority: task.defaultPriority,
                defaultEstimatedHours: task.defaultEstimatedHours ? task.defaultEstimatedHours.toNumber() : null,
                clientVisible: task.clientVisible,
                dependsOnOrder: task.dependsOnOrder,
              })),
            }))}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="sr-only">{t("createTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestForm
              projects={projects.map((p) => ({ id: p.id, label: p.name }))}
              requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name, category: rt.category }))}
              defaultProjectId={projectId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
