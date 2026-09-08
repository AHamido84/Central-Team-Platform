import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { TaskGeneratorBuilder } from "@/components/requests/task-generator-builder";
import { pickLocalized } from "@/lib/dynamic-form-shared";

export default async function GenerateTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const request = await prisma.request.findUnique({
    where: { id },
    select: { id: true, title: true, requestNumber: true, requestTypeId: true },
  });
  if (!request) notFound();

  const [templates, departments, internalUsers] = await Promise.all([
    prisma.requestTemplate.findMany({
      where: {
        requestTypeId: request.requestTypeId,
        isActive: true,
        isArchived: false,
        currentVersionId: { not: null },
      },
      include: { currentVersion: { include: { tasks: { orderBy: { order: "asc" } } } } },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: t("internalTitle"), href: "/requests" },
          { label: `#${request.requestNumber}`, href: `/requests/${request.id}` },
          { label: t("detail.generateFromTemplate") },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("detail.generateFromTemplate")}</h1>
        <p className="text-sm text-muted-foreground">{request.title}</p>
      </div>
      <TaskGeneratorBuilder
        requestId={request.id}
        templates={templates
          .filter((tpl) => tpl.currentVersion)
          .map((tpl) => ({
            id: tpl.id,
            name: pickLocalized(tpl.currentVersion!.nameAr, tpl.currentVersion!.nameEn, locale),
            items: tpl.currentVersion!.tasks.map((task) => ({
              order: task.order,
              title: pickLocalized(task.titleAr, task.titleEn, locale),
              description: task.description,
              departmentId: task.departmentId,
              defaultPriority: task.defaultPriority,
              defaultEstimatedHours: task.defaultEstimatedHours ? task.defaultEstimatedHours.toNumber() : null,
              dependsOnOrder: task.dependsOnOrder,
            })),
          }))}
        departments={departments.map((d) => ({ id: d.id, label: d.name }))}
        assignees={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
      />
    </div>
  );
}
