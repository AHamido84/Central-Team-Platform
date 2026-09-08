import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { InternalRequestForm } from "@/components/requests/internal-request-form";
import { TemplateRequestWizard } from "@/components/requests/template-request-wizard";
import { prisma } from "@/lib/prisma";

export default async function NewInternalRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; projectId?: string; mode?: string }>;
}) {
  const { clientId, projectId, mode } = await searchParams;
  const useTemplate = mode === "template";
  const t = await getTranslations("requests");
  const contextQuery = `${clientId ? `clientId=${clientId}&` : ""}${projectId ? `projectId=${projectId}&` : ""}`;

  const [clients, projects, requestTypes, departments, internalUsers, templates] = await Promise.all([
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientId: true } }),
    prisma.requestType.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("createTitle")}</h1>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          <Button size="sm" variant={!useTemplate ? "secondary" : "ghost"} render={<Link href={`/requests/new?${contextQuery}`}>{t("wizard.customRequest")}</Link>} />
          <Button size="sm" variant={useTemplate ? "secondary" : "ghost"} render={<Link href={`/requests/new?${contextQuery}mode=template`}>{t("wizard.fromTemplate")}</Link>} />
        </div>
      </div>
      {useTemplate ? (
        <TemplateRequestWizard
          isPortal={false}
          clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
          projects={projects.map((p) => ({ id: p.id, label: p.name, clientId: p.clientId }))}
          requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name }))}
          departments={departments.map((d) => ({ id: d.id, label: d.name }))}
          assignees={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
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
          defaultClientId={clientId}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="sr-only">{t("createTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <InternalRequestForm
              clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
              projects={projects.map((p) => ({ id: p.id, label: p.name, clientId: p.clientId }))}
              requestTypes={requestTypes.map((rt) => ({ id: rt.id, label: rt.name, category: rt.category }))}
              defaultClientId={clientId}
              defaultProjectId={projectId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
