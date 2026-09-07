import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { RequestTimeline, type RequestTimelineEntry } from "@/components/portal/request-timeline";
import { CommentThread } from "@/components/portal/comment-thread";
import { RequestStatusSelect } from "@/components/requests/request-status-select";
import { RequestAssigneeSelect } from "@/components/requests/request-assignee-select";
import { formatDate } from "@/lib/format-date";

export default async function InternalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("requests");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();

  const [request, auditEntries, comments, internalUsers] = await Promise.all([
    prisma.request.findUnique({
      where: { id },
      include: {
        requestType: true,
        client: { select: { id: true, companyName: true } },
        project: { select: { id: true, name: true } },
        requestedBy: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
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
  ]);

  if (!request) notFound();

  const timeline: RequestTimelineEntry[] = [
    { id: "created", type: "created", atLabel: formatDate(request.createdAt, locale) },
    ...auditEntries.map((entry) => {
      const metadata = entry.metadata as { status?: string } | null;
      if (entry.action === "REQUEST_STATUS_UPDATED" && metadata?.status) {
        return {
          id: entry.id,
          type: "statusChanged" as const,
          atLabel: formatDate(entry.createdAt, locale),
          status: metadata.status,
        };
      }
      return {
        id: entry.id,
        type: "assigned" as const,
        atLabel: formatDate(entry.createdAt, locale),
        name: request.assignedTo?.name ?? t("noAssignee"),
      };
    }),
  ];

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
        <Badge variant="secondary">{t(`status.${request.status}`)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("fields.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {request.description || "—"}
              </p>
            </CardContent>
          </Card>

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
                <span className="text-muted-foreground">{t("fields.dueDate")}</span>
                <span className="font-medium">{formatDate(request.dueDate, locale)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("timeline.created")}</CardTitle>
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
