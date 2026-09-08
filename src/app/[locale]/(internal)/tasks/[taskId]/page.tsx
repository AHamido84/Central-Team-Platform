import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { CommentThread } from "@/components/portal/comment-thread";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { TaskAssigneeSelect } from "@/components/tasks/task-assignee-select";
import { TaskDependenciesPanel } from "@/components/tasks/task-dependencies-panel";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { TaskHeaderActions } from "@/components/tasks/task-header-actions";
import { FilesTable } from "@/components/portal/files-table";
import { formatDate } from "@/lib/format-date";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const t = await getTranslations("tasks");
  const tFiles = await getTranslations("files");
  const tPriority = await getTranslations("projects.priority");
  const tCommon = await getTranslations("common");
  const tActivity = await getTranslations("activity.actions");
  const tActivityRoot = await getTranslations("activity");
  const locale = await getLocale();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, name: true } },
      request: { select: { id: true, requestNumber: true, title: true } },
      scopeItem: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      dependsOn: { include: { dependsOnTask: { select: { id: true, title: true, status: true } } } },
      blockingFor: { include: { task: { select: { id: true, title: true } } } },
    },
  });
  if (!task) notFound();

  const [scopeItems, departments, internalUsers, candidateTasks, comments, auditEntries, assets] =
    await Promise.all([
      prisma.scopeItem.findMany({
        where: { projectScope: { projectId: task.projectId } },
        select: { id: true, name: true },
      }),
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.task.findMany({
        where: task.requestId
          ? { requestId: task.requestId, id: { not: task.id } }
          : { projectId: task.projectId, id: { not: task.id } },
        select: { id: true, title: true },
      }),
      prisma.comment.findMany({
        where: { entityType: "TASK", entityId: taskId },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      }),
      prisma.auditLog.findMany({
        where: { entityType: "Task", entityId: taskId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.asset.findMany({ where: { taskId }, orderBy: { createdAt: "desc" } }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: t("internalTitle"), href: "/tasks" }, { label: task.title }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/projects/${task.project.id}`} className="hover:underline">
              {task.project.name}
            </Link>
            {task.request && (
              <>
                {" · "}
                <Link href={`/requests/${task.request.id}`} className="hover:underline">
                  #{task.request.requestNumber} {task.request.title}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t(`status.${task.status}`)}</Badge>
          <EditTaskDialog
            taskId={task.id}
            scopeItems={scopeItems.map((s) => ({ id: s.id, label: s.name }))}
            departments={departments.map((d) => ({ id: d.id, label: d.name }))}
            initial={{
              title: task.title,
              description: task.description,
              notes: task.notes,
              priority: task.priority,
              scopeItemId: task.scopeItemId,
              departmentId: task.departmentId,
              estimatedHours: task.estimatedHours ? task.estimatedHours.toNumber() : null,
              actualHours: task.actualHours ? task.actualHours.toNumber() : null,
              startDate: task.startDate,
              dueDate: task.dueDate,
              clientVisible: task.clientVisible,
            }}
          />
          <TaskHeaderActions taskId={task.id} isArchived={task.status === "ARCHIVED"} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("fields.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{task.description || "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dependencies.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskDependenciesPanel
                taskId={task.id}
                dependencies={task.dependsOn.map((d) => ({
                  id: d.dependsOnTask.id,
                  title: d.dependsOnTask.title,
                  status: d.dependsOnTask.status,
                  met: d.dependsOnTask.status === "COMPLETED",
                }))}
                candidates={candidateTasks.map((c) => ({ id: c.id, title: c.title }))}
              />
              {task.blockingFor.length > 0 && (
                <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {t("fields.dependencies")}: {task.blockingFor.length}
                  </span>
                  <ul className="flex flex-col gap-1 text-sm">
                    {task.blockingFor.map((b) => (
                      <li key={b.task.id}>
                        <Link href={`/tasks/${b.task.id}`} className="hover:underline">
                          {b.task.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {assets.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{tFiles("title")}</h2>
              <FilesTable assets={assets} locale={locale} basePath="" showProject={false} />
            </div>
          )}

          <CommentThread
            comments={comments.map((c) => ({
              id: c.id,
              body: c.body,
              createdAtLabel: formatDate(c.createdAt, locale),
              author: c.author,
            }))}
            entityType="TASK"
            entityId={task.id}
            revalidatePaths={[`/tasks/${task.id}`]}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{tCommon("actions.edit")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">{t("fields.status")}</span>
                <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">{t("fields.assignee")}</span>
                <TaskAssigneeSelect
                  taskId={task.id}
                  currentAssigneeId={task.assigneeId}
                  assignees={internalUsers}
                />
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.department")}</span>
                <span className="font-medium">{task.department?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.priority")}</span>
                <span className="font-medium">{tPriority(task.priority)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.estimatedHours")}</span>
                <span className="font-medium">{task.estimatedHours?.toNumber() ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.actualHours")}</span>
                <span className="font-medium">{task.actualHours?.toNumber() ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.startDate")}</span>
                <span className="font-medium">{formatDate(task.startDate, locale)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.dueDate")}</span>
                <span className="font-medium">{formatDate(task.dueDate, locale)}</span>
              </div>
              {task.notes && (
                <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
                  <span className="text-xs text-muted-foreground">{t("fields.notes")}</span>
                  <span className="whitespace-pre-wrap">{task.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {auditEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{tActivityRoot("title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {auditEntries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-2">
                      <span>{tActivity(entry.action as never)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
