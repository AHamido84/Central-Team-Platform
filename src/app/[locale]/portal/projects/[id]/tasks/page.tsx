import { getTranslations, getLocale } from "next-intl/server";
import { ListChecks } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { TasksTable } from "@/components/portal/tasks-table";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations("tasks");
  const locale = await getLocale();

  const tasks = await prisma.task.findMany({
    where: { projectId: id, clientVisible: true },
    orderBy: { createdAt: "desc" },
  });

  return tasks.length === 0 ? (
    <EmptyState icon={ListChecks} title={t("empty.title")} description={t("empty.description")} />
  ) : (
    <TasksTable tasks={tasks} locale={locale} showProject={false} />
  );
}
