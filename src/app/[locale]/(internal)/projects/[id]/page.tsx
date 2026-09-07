import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/portal/stat-card";
import { ProgressMeter } from "@/components/portal/progress-meter";
import { prisma } from "@/lib/prisma";
import { computeProjectProgress } from "@/lib/project-progress";
import { formatDate } from "@/lib/format-date";
import { OPEN_REQUEST_STATUSES } from "@/lib/request-status";
import { Inbox, ListChecks, PackageCheck } from "lucide-react";

export default async function InternalProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();

  const [project, openRequestCount, tasksInProgress, deliverablesInReview, scope] = await Promise.all([
    prisma.project.findUniqueOrThrow({
      where: { id },
      include: { owner: { select: { name: true } }, accountManager: { select: { name: true } } },
    }),
    prisma.request.count({ where: { projectId: id, status: { in: OPEN_REQUEST_STATUSES } } }),
    prisma.task.count({ where: { projectId: id, status: { in: ["IN_PROGRESS", "IN_REVIEW"] } } }),
    prisma.deliverable.count({ where: { projectId: id, status: "IN_REVIEW" } }),
    prisma.projectScope.findFirst({
      where: { projectId: id },
      orderBy: { version: "desc" },
      include: { items: { select: { quantity: true, status: true } } },
    }),
  ]);

  const progress = computeProjectProgress(scope?.items ?? []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("dashboard.stats.openRequests")} value={openRequestCount} icon={Inbox} />
        <StatCard label={t("dashboard.stats.inProgressTasks")} value={tasksInProgress} icon={ListChecks} />
        <StatCard
          label={t("dashboard.stats.deliverablesInReview")}
          value={deliverablesInReview}
          icon={PackageCheck}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("projects.overview.scopeProgress")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <ProgressMeter percent={progress.percent} className="h-2" />
              <span className="shrink-0 text-sm font-medium tabular-nums">{progress.percent}%</span>
            </div>
            <Link href={`/projects/${id}/scope`} className="text-sm text-primary hover:underline">
              {t("projects.overview.viewFullScope")}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("projects.overview.quickStats")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <InfoRow label={t("projects.fields.owner")} value={project.owner?.name} />
            <InfoRow label={t("projects.fields.accountManager")} value={project.accountManager?.name} />
            <InfoRow label={t("projects.fields.priority")} value={t(`projects.priority.${project.priority}`)} />
            <InfoRow label={t("projects.fields.startDate")} value={formatDate(project.startDate, locale)} />
            <InfoRow label={t("projects.fields.dueDate")} value={formatDate(project.dueDate, locale)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value ?? "—"}</span>
    </div>
  );
}
