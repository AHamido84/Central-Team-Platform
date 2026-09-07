import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, assertClientScope, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { formatDate } from "@/lib/format-date";
import { Link } from "@/i18n/navigation";
import { RequestMetadataCard } from "@/components/requests/request-metadata-card";
import { RequestTimeline, type RequestTimelineEntry } from "@/components/portal/request-timeline";
import { CommentThread } from "@/components/portal/comment-thread";
import { fieldSetForCategory } from "@/lib/request-type-fields";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      requestType: true,
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!request) notFound();

  try {
    assertClientScope(user, request.clientId);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const [auditEntries, comments] = await Promise.all([
    prisma.auditLog.findMany({
      where: { entityType: "Request", entityId: id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.findMany({
      where: { entityType: "REQUEST", entityId: id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true } } },
    }),
  ]);

  // Only REQUEST_STATUS_UPDATED and REQUEST_ASSIGNED map to a timeline row —
  // REQUEST_CREATED (and anything else logged against this request) is
  // covered by the synthetic "created" entry above and must not fall through
  // to a default, or it renders as a misleading "assigned to ..." event.
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

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: t("title"), href: "/portal/requests" },
          { label: `#${request.requestNumber}` },
        ]}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
          <p className="text-sm text-muted-foreground">
            {request.requestType.name}
            {request.project && (
              <>
                {" · "}
                <Link href={`/portal/projects/${request.project.id}`} className="hover:underline">
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
            <CardContent className="flex flex-col gap-4 text-sm">
              <p className="whitespace-pre-wrap text-foreground">
                {request.description || "—"}
              </p>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <InfoRow label={t("fields.requestNumber")} value={`#${request.requestNumber}`} />
                <InfoRow label={t("fields.dueDate")} value={formatDate(request.dueDate, locale)} />
                <InfoRow label={t("fields.updatedAt")} value={formatDate(request.updatedAt, locale)} />
              </div>
            </CardContent>
          </Card>

          <RequestMetadataCard
            fieldSet={fieldSetForCategory(request.requestType.category)}
            metadata={request.metadata as Record<string, string> | null}
          />

          <CommentThread
            comments={comments.map((c) => ({
              id: c.id,
              body: c.body,
              createdAtLabel: formatDate(c.createdAt, locale),
              author: c.author,
            }))}
            entityType="REQUEST"
            entityId={request.id}
            revalidatePaths={[`/portal/requests/${request.id}`]}
          />
        </div>

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
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
