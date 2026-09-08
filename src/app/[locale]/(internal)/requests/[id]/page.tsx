import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ProgressMeter } from "@/components/portal/progress-meter";
import { RequestTimeline, type RequestTimelineEntry } from "@/components/portal/request-timeline";
import { CommentThread } from "@/components/portal/comment-thread";
import { RequestStatusSelect } from "@/components/requests/request-status-select";
import { RequestAssigneeSelect } from "@/components/requests/request-assignee-select";
import { RequestMetadataCard } from "@/components/requests/request-metadata-card";
import { RequestHeaderActions } from "@/components/requests/request-header-actions";
import { EditRequestDialog } from "@/components/requests/edit-request-dialog";
import { SendForReviewButton } from "@/components/requests/send-for-review-button";
import { TasksTable } from "@/components/portal/tasks-table";
import { DeliverableCard } from "@/components/portal/deliverable-card";
import { FilesTable } from "@/components/portal/files-table";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { fieldSetForCategory } from "@/lib/request-type-fields";
import { requestProgressPercent } from "@/lib/request-progress";
import { formatDate } from "@/lib/format-date";
import { Link as LinkIcon } from "lucide-react";

const REVIEW_ACTIONS = new Set([
  "REQUEST_SENT_FOR_CLIENT_REVIEW",
  "REQUEST_CHANGES_REQUESTED",
  "REQUEST_APPROVED",
]);

export default async function InternalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("requests");
  const tCommon = await getTranslations("common");
  const tPriority = await getTranslations("projects.priority");
  const tActivity = await getTranslations("activity.actions");
  const locale = await getLocale();

  const [request, auditEntries, comments, internalUsers, scopeItems, campaigns, departments] = await Promise.all([
    prisma.request.findUnique({
      where: { id },
      include: {
        requestType: true,
        client: { select: { id: true, companyName: true } },
        project: { select: { id: true, name: true } },
        scopeItem: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
        requestedBy: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
        tasks: {
          orderBy: { createdAt: "asc" },
          include: { assignee: { select: { name: true } } },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "Request", entityId: id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.findMany({
      where: { entityType: "REQUEST", entityId: id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.scopeItem.findMany({
      where: { projectScope: { project: { requests: { some: { id } } } } },
      select: { id: true, name: true },
    }),
    prisma.campaign.findMany({
      where: { project: { requests: { some: { id } } } },
      select: { id: true, name: true },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!request) notFound();

  const [deliverables, assets] = await Promise.all([
    prisma.deliverable.findMany({
      where: { task: { requestId: id } },
      include: { assets: true },
    }),
    prisma.asset.findMany({ where: { requestId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  const progress = requestProgressPercent(request.tasks);

  const timeline: RequestTimelineEntry[] = [
    { id: "created", type: "created", atLabel: formatDate(request.createdAt, locale) },
    ...auditEntries.flatMap((entry): RequestTimelineEntry[] => {
      const metadata = entry.metadata as { status?: string } | null;
      if (entry.action === "REQUEST_STATUS_UPDATED" && metadata?.status) {
        return [
          {
            id: entry.id,
            type: "statusChanged",
            atLabel: formatDate(entry.createdAt, locale),
            status: metadata.status,
          },
        ];
      }
      if (entry.action === "REQUEST_ASSIGNED") {
        return [
          {
            id: entry.id,
            type: "assigned",
            atLabel: formatDate(entry.createdAt, locale),
            name: request.assignedTo?.name ?? t("noAssignee"),
          },
        ];
      }
      return [];
    }),
  ];

  const reviewEntries = auditEntries.filter((entry) => REVIEW_ACTIONS.has(entry.action));

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: t("internalTitle"), href: "/requests" }, { label: `#${request.requestNumber}` }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/clients/${request.client.id}`} className="hover:underline">
              {request.client.companyName}
            </Link>
            {request.project && (
              <>
                {" · "}
                <Link href={`/projects/${request.project.id}`} className="hover:underline">
                  {request.project.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t(`status.${request.status}`)}</Badge>
          {request.status !== "CLIENT_REVIEW" && request.status !== "COMPLETED" && (
            <SendForReviewButton requestId={request.id} />
          )}
          <EditRequestDialog
            requestId={request.id}
            scopeItems={scopeItems.map((s) => ({ id: s.id, label: s.name }))}
            campaigns={campaigns.map((c) => ({ id: c.id, label: c.name }))}
            initial={{
              title: request.title,
              description: request.description,
              notes: request.notes,
              priority: request.priority,
              scopeItemId: request.scopeItemId,
              campaignId: request.campaignId,
              requestedDate: request.requestedDate,
              dueDate: request.dueDate,
            }}
          />
          <RequestHeaderActions requestId={request.id} isArchived={request.status === "ARCHIVED"} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Request information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.sections.info")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {request.description || "—"}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <ProgressMeter percent={progress} className="h-2" />
                <span className="shrink-0 text-sm font-medium tabular-nums">{progress}%</span>
              </div>
              <span className="text-xs text-muted-foreground">{t("detail.progress")}</span>
            </CardContent>
          </Card>

          <RequestMetadataCard
            fieldSet={fieldSetForCategory(request.requestType.category)}
            metadata={request.metadata as Record<string, string> | null}
          />

          {/* Scope */}
          {request.scopeItem && (
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.sections.scope")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/projects/${request.project?.id}/scope`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="size-4" />
                  {request.scopeItem.name}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("detail.sections.tasks")}</CardTitle>
              {request.project && (
                <div className="flex items-center gap-2">
                  <AddTaskDialog
                    projectId={request.project.id}
                    requestId={request.id}
                    scopeItems={scopeItems.map((s) => ({ id: s.id, label: s.name }))}
                    departments={departments.map((d) => ({ id: d.id, label: d.name }))}
                    assignees={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
                  />
                  <Link
                    href={`/requests/${request.id}/generate-tasks`}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("detail.generateFromTemplate")}
                  </Link>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {request.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("detail.noTasks")}</p>
              ) : (
                <TasksTable
                  tasks={request.tasks}
                  locale={locale}
                  basePath=""
                  showProject={false}
                  showAssignee
                />
              )}
            </CardContent>
          </Card>

          {/* Deliverables */}
          {deliverables.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{t("detail.sections.deliverables")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {deliverables.map((d) => (
                  <DeliverableCard
                    key={d.id}
                    basePath=""
                    showProject={false}
                    deliverable={{
                      id: d.id,
                      title: d.title,
                      category: d.category,
                      status: d.status,
                      version: d.version,
                      assets: d.assets,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approvals */}
          {reviewEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.sections.approvals")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {reviewEntries.map((entry) => (
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

          {/* Files */}
          {assets.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{t("detail.sections.files")}</h2>
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
            entityType="REQUEST"
            entityId={request.id}
            revalidatePaths={[`/requests/${request.id}`]}
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
                <RequestStatusSelect requestId={request.id} currentStatus={request.status} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">{t("fields.assignee")}</span>
                <RequestAssigneeSelect
                  requestId={request.id}
                  currentAssigneeId={request.assignedToId}
                  assignees={internalUsers}
                />
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.requestType")}</span>
                <span className="font-medium">{request.requestType.name}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.priority")}</span>
                <span className="font-medium">{tPriority(request.priority)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.requestedDate")}</span>
                <span className="font-medium">{formatDate(request.requestedDate, locale)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("fields.dueDate")}</span>
                <span className="font-medium">{formatDate(request.dueDate, locale)}</span>
              </div>
              {request.notes && (
                <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
                  <span className="text-xs text-muted-foreground">{t("fields.notes")}</span>
                  <span className="whitespace-pre-wrap">{request.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("detail.sections.activity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestTimeline entries={timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
