import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { TasksTable } from "@/components/portal/tasks-table";
import { EmptyState } from "@/components/portal/empty-state";
import { TasksBoard } from "@/components/tasks/tasks-board";
import type { TaskStatus } from "@prisma/client";

const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

export default async function InternalTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const isBoard = view === "board";
  const t = await getTranslations("tasks");
  const tStatus = await getTranslations("tasks.status");
  const locale = await getLocale();

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("internalTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("internalSubtitle")}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          <Button
            size="sm"
            variant={isBoard ? "ghost" : "secondary"}
            render={<Link href="/tasks">{t("listView")}</Link>}
          />
          <Button
            size="sm"
            variant={isBoard ? "secondary" : "ghost"}
            render={<Link href="/tasks?view=board">{t("boardView")}</Link>}
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("empty.title")} description={t("empty.description")} />
      ) : isBoard ? (
        <TasksBoard
          columns={TASK_STATUSES.map((status) => ({ id: status, label: tStatus(status) }))}
          tasks={tasks.map((task) => ({
            id: task.id,
            status: task.status,
            title: task.title,
            projectName: task.project.name,
            assigneeName: task.assignee?.name,
          }))}
        />
      ) : (
        <TasksTable tasks={tasks} locale={locale} basePath="" showProject showAssignee />
      )}
    </div>
  );
}
