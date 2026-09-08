import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { TaskGeneratorBuilder } from "@/components/requests/task-generator-builder";

export default async function GenerateTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("requests");

  const request = await prisma.request.findUnique({
    where: { id },
    select: { id: true, title: true, requestNumber: true, requestType: { select: { category: true } } },
  });
  if (!request) notFound();

  const [templates, departments, internalUsers] = await Promise.all([
    prisma.requestTemplate.findMany({
      where: {
        isActive: true,
        OR: [{ category: request.requestType.category }, { category: null }],
      },
      include: { items: true },
      orderBy: { name: "asc" },
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
        templates={templates.map((tpl) => ({
          id: tpl.id,
          name: tpl.name,
          items: tpl.items.map((item) => ({
            order: item.order,
            title: item.title,
            description: item.description,
            departmentId: item.departmentId,
            defaultPriority: item.defaultPriority,
            defaultEstimatedHours: item.defaultEstimatedHours ? item.defaultEstimatedHours.toNumber() : null,
            dependsOnOrder: item.dependsOnOrder,
          })),
        }))}
        departments={departments.map((d) => ({ id: d.id, label: d.name }))}
        assignees={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
      />
    </div>
  );
}
