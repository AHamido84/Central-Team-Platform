import { getTranslations, getLocale } from "next-intl/server";
import { ListChecks } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TasksTable } from "@/components/portal/tasks-table";
import { EmptyState } from "@/components/portal/empty-state";

export default async function ClientTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("tasks");
  const locale = await getLocale();

  const tasks = await prisma.task.findMany({
    where: { project: { clientId: id } },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true } }, assignee: { select: { name: true } } },
  });

  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} title={t("empty.title")} description={t("empty.description")} />;
  }

  return <TasksTable tasks={tasks} locale={locale} basePath="" showProject showAssignee />;
}
