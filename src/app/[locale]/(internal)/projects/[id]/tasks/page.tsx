import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { TasksTable } from "@/components/portal/tasks-table";
import { EmptyState } from "@/components/portal/empty-state";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { ListChecks } from "lucide-react";

export default async function InternalProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("tasks");
  const locale = await getLocale();

  const [tasks, scopeItems, internalUsers, departments] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      include: { assignee: { select: { name: true } } },
    }),
    prisma.scopeItem.findMany({
      where: { projectScope: { projectId: id } },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { clientId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddTaskDialog
          projectId={id}
          scopeItems={scopeItems.map((s) => ({ id: s.id, label: s.name }))}
          departments={departments.map((d) => ({ id: d.id, label: d.name }))}
          assignees={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
        />
      </div>
      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <TasksTable tasks={tasks} locale={locale} basePath="" showProject={false} showAssignee />
      )}
    </div>
  );
}
