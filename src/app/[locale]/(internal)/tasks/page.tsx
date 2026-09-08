import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { TasksTable } from "@/components/portal/tasks-table";
import { EmptyState } from "@/components/portal/empty-state";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { TasksCalendar } from "@/components/tasks/tasks-calendar";
import { FilterBar } from "@/components/shared/filter-bar";
import { taskStatusValues } from "@/lib/validations/task-status-values";
import { priorityValues } from "@/lib/validations/project";
import type { TaskStatus, Priority } from "@prisma/client";

const TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "CHANGES_REQUIRED",
  "COMPLETED",
  "CANCELLED",
];

const UNASSIGNED = "__unassigned__";

export default async function InternalTasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    projectId?: string;
    clientId?: string;
    requestId?: string;
    assigneeId?: string;
    departmentId?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
  }>;
}) {
  const {
    view,
    projectId,
    clientId,
    requestId,
    assigneeId,
    departmentId,
    priority,
    status,
    dueDate,
  } = await searchParams;
  const isBoard = view === "board";
  const isCalendar = view === "calendar";
  const t = await getTranslations("tasks");
  const tStatus = await getTranslations("tasks.status");
  const tPriority = await getTranslations("projects.priority");
  const tFilters = await getTranslations("tasks.filters");
  const locale = await getLocale();

  const where = {
    projectId: projectId || undefined,
    project: clientId ? { clientId } : undefined,
    requestId: requestId || undefined,
    assigneeId: assigneeId ? (assigneeId === UNASSIGNED ? null : assigneeId) : undefined,
    departmentId: departmentId || undefined,
    priority: priority ? (priority as Priority) : undefined,
    status: status ? (status as TaskStatus) : undefined,
    dueDate: dueDate ? { lte: new Date(dueDate) } : undefined,
  };

  const [tasks, projects, clients, requests, internalUsers, departments] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.request.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, requestNumber: true } }),
    prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("internalTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("internalSubtitle")}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          <Button size="sm" variant={!isBoard && !isCalendar ? "secondary" : "ghost"} render={<Link href="/tasks">{t("listView")}</Link>} />
          <Button size="sm" variant={isBoard ? "secondary" : "ghost"} render={<Link href="/tasks?view=board">{t("boardView")}</Link>} />
          <Button size="sm" variant={isCalendar ? "secondary" : "ghost"} render={<Link href="/tasks?view=calendar">{t("calendarView")}</Link>} />
        </div>
      </div>

      <FilterBar
        resetLabel={tFilters("reset")}
        dateKey="dueDate"
        filters={[
          {
            key: "clientId",
            placeholder: tFilters("allClients"),
            options: clients.map((c) => ({ value: c.id, label: c.companyName })),
          },
          {
            key: "projectId",
            placeholder: tFilters("allProjects"),
            options: projects.map((p) => ({ value: p.id, label: p.name })),
          },
          {
            key: "requestId",
            placeholder: tFilters("allRequests"),
            options: requests.map((r) => ({ value: r.id, label: `#${r.requestNumber} ${r.title}` })),
          },
          {
            key: "departmentId",
            placeholder: tFilters("allDepartments"),
            options: departments.map((d) => ({ value: d.id, label: d.name })),
          },
          {
            key: "assigneeId",
            placeholder: tFilters("allAssignees"),
            options: [
              { value: UNASSIGNED, label: tFilters("unassigned") },
              ...internalUsers.map((u) => ({ value: u.id, label: u.name })),
            ],
          },
          {
            key: "priority",
            placeholder: tFilters("allPriorities"),
            options: priorityValues.map((value) => ({ value, label: tPriority(value) })),
          },
          {
            key: "status",
            placeholder: tFilters("allStatuses"),
            options: taskStatusValues.map((value) => ({ value, label: tStatus(value) })),
          },
        ]}
      />

      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("empty.title")} description={t("empty.description")} />
      ) : isBoard ? (
        <TasksBoard
          columns={TASK_STATUSES.map((s) => ({ id: s, label: tStatus(s) }))}
          tasks={tasks.map((task) => ({
            id: task.id,
            status: task.status,
            title: task.title,
            projectName: task.project.name,
            assigneeName: task.assignee?.name,
          }))}
        />
      ) : isCalendar ? (
        <TasksCalendar
          tasks={tasks.map((task) => ({
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            status: task.status,
          }))}
          locale={locale}
        />
      ) : (
        <TasksTable tasks={tasks} locale={locale} basePath="" showProject showAssignee />
      )}
    </div>
  );
}
