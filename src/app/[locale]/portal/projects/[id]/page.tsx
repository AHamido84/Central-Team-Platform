import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { computeProjectProgress } from "@/lib/project-progress";
import { ProgressMeter } from "@/components/portal/progress-meter";
import { ActivityTimeline } from "@/components/portal/activity-timeline";
import { OPEN_REQUEST_STATUSES } from "@/lib/request-status";
import { IN_PROGRESS_TASK_STATUSES } from "@/lib/task-capacity";
import { ChevronRight } from "lucide-react";
import { DirectionalIcon } from "@/components/layout/directional-icon";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations();

  const [scope, deliverableCount, openRequestCount, inProgressTaskCount, recentActivity] =
    await Promise.all([
      prisma.projectScope.findFirst({
        where: { projectId: id },
        orderBy: { version: "desc" },
        include: { items: { select: { quantity: true, status: true } } },
      }),
      prisma.deliverable.count({ where: { projectId: id } }),
      prisma.request.count({ where: { projectId: id, status: { in: OPEN_REQUEST_STATUSES } } }),
      prisma.task.count({
        where: { projectId: id, clientVisible: true, status: { in: IN_PROGRESS_TASK_STATUSES } },
      }),
      prisma.auditLog.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  const progress = computeProjectProgress(scope?.items ?? []);
  const tActivity = await getTranslations("activity.actions");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("projects.overview.scopeProgress")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">{progress.percent}%</span>
          </div>
          <ProgressMeter percent={progress.percent} className="h-2.5" />
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-sm">
            <StatBit value={progress.plannedQty} label={t("projects.scope.status.PLANNED")} />
            <StatBit value={progress.inProgressQty} label={t("projects.scope.status.IN_PROGRESS")} />
            <StatBit value={progress.completedQty} label={t("projects.scope.status.COMPLETED")} />
          </div>
          <Link
            href={`/portal/projects/${id}/scope`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t("projects.overview.viewFullScope")}
            <DirectionalIcon icon={ChevronRight} className="size-4" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("projects.overview.quickStats")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <InfoRow label={t("nav.workspace.deliverables")} value={deliverableCount} />
          <InfoRow label={t("nav.workspace.requests")} value={openRequestCount} />
          <InfoRow label={t("dashboard.stats.inProgressTasks")} value={inProgressTaskCount} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("nav.workspace.activity")}</CardTitle>
          <Link
            href={`/portal/projects/${id}/activity`}
            className="text-sm text-primary hover:underline"
          >
            {t("common.actions.viewAll")}
          </Link>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("activity.empty.title")}</p>
          ) : (
            <ActivityTimeline
              entries={recentActivity.map((entry) => ({
                id: entry.id,
                action: entry.action,
                createdAtLabel: entry.createdAt.toLocaleDateString(),
              }))}
              labelFor={(action) => tActivity(action)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function StatBit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-muted/50 py-2">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
