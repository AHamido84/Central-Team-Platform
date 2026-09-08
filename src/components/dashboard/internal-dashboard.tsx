import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Building2,
  FolderKanban,
  Inbox,
  ListChecks,
  PackageCheck,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressMeter } from "@/components/portal/progress-meter";
import { ComparisonBarList } from "@/components/dashboard/comparison-bar-list";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CampaignMetricsGrid } from "@/components/portal/campaign-metrics-grid";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authorization";
import { computeProjectProgress } from "@/lib/project-progress";
import { computeTrendPercent } from "@/lib/compute-trend";
import { OPEN_REQUEST_STATUSES } from "@/lib/request-status";
import { ACTIVE_TASK_STATUSES, IN_PROGRESS_TASK_STATUSES } from "@/lib/task-capacity";
import { requestStatusValues } from "@/lib/validations/request-status-values";
import type { RequestStatus } from "@prisma/client";

const REQUEST_STATUSES: RequestStatus[] = [...requestStatusValues];

export async function InternalDashboard() {
  const sessionUser = await requireUser();
  const t = await getTranslations();
  const locale = await getLocale();

  const now = new Date();
  const period30 = new Date(now);
  period30.setDate(period30.getDate() - 30);
  const period60 = new Date(now);
  period60.setDate(period60.getDate() - 60);

  const [
    user,
    totalClients,
    activeProjects,
    openRequests,
    tasksInProgress,
    deliverablesInReview,
    activeCampaigns,
    [clientsRecent, clientsPrior],
    [projectsRecent, projectsPrior],
    [requestsRecent, requestsPrior],
    [tasksRecent, tasksPrior],
    [deliverablesRecent, deliverablesPrior],
    [campaignsRecent, campaignsPrior],
    inProgressProjects,
    requestsByStatus,
    teamMembers,
    activeCampaignMetrics,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { name: true } }),
    prisma.client.count(),
    prisma.project.count({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.request.count({ where: { status: { in: OPEN_REQUEST_STATUSES } } }),
    prisma.task.count({ where: { status: { in: IN_PROGRESS_TASK_STATUSES } } }),
    prisma.deliverable.count({ where: { status: "IN_REVIEW" } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    Promise.all([
      prisma.client.count({ where: { createdAt: { gte: period30 } } }),
      prisma.client.count({ where: { createdAt: { gte: period60, lt: period30 } } }),
    ]),
    Promise.all([
      prisma.project.count({ where: { createdAt: { gte: period30 } } }),
      prisma.project.count({ where: { createdAt: { gte: period60, lt: period30 } } }),
    ]),
    Promise.all([
      prisma.request.count({ where: { createdAt: { gte: period30 } } }),
      prisma.request.count({ where: { createdAt: { gte: period60, lt: period30 } } }),
    ]),
    Promise.all([
      prisma.task.count({ where: { createdAt: { gte: period30 } } }),
      prisma.task.count({ where: { createdAt: { gte: period60, lt: period30 } } }),
    ]),
    Promise.all([
      prisma.deliverable.count({ where: { createdAt: { gte: period30 } } }),
      prisma.deliverable.count({ where: { createdAt: { gte: period60, lt: period30 } } }),
    ]),
    Promise.all([
      prisma.campaign.count({ where: { createdAt: { gte: period30 } } }),
      prisma.campaign.count({ where: { createdAt: { gte: period60, lt: period30 } } }),
    ]),
    prisma.project.findMany({
      where: { status: "IN_PROGRESS" },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: {
        client: { select: { companyName: true } },
        scopes: {
          orderBy: { version: "desc" },
          take: 1,
          include: { items: { select: { quantity: true, status: true } } },
        },
      },
    }),
    Promise.all(
      REQUEST_STATUSES.map(async (status) => ({
        status,
        count: await prisma.request.count({ where: { status } }),
      })),
    ),
    prisma.user.findMany({
      where: { clientId: null },
      include: {
        _count: {
          select: { assignedTasks: { where: { status: { in: ACTIVE_TASK_STATUSES } } } },
        },
      },
    }),
    prisma.campaignMetric.findMany({ where: { campaign: { status: "ACTIVE" } } }),
  ]);

  const teamWorkload = teamMembers
    .map((member) => ({ label: member.name, value: member._count.assignedTasks }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const aggregatedMetric = activeCampaignMetrics.reduce(
    (acc, m) => ({
      spend: acc.spend + m.spend.toNumber(),
      impressions: acc.impressions + m.impressions,
      reach: acc.reach + m.reach,
      clicks: acc.clicks + m.clicks,
      leads: acc.leads + m.leads,
      conversions: acc.conversions + m.conversions,
      revenue: acc.revenue + m.revenue.toNumber(),
    }),
    { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.internalGreeting", { name: user.name })}
        </h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.internalSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label={t("dashboard.kpis.totalClients")}
          value={totalClients}
          icon={Building2}
          trendPercent={computeTrendPercent(clientsRecent, clientsPrior)}
          trendCaption={t("dashboard.trend.vsLastPeriod")}
        />
        <KpiCard
          label={t("dashboard.kpis.activeProjects")}
          value={activeProjects}
          icon={FolderKanban}
          trendPercent={computeTrendPercent(projectsRecent, projectsPrior)}
          trendCaption={t("dashboard.trend.vsLastPeriod")}
        />
        <KpiCard
          label={t("dashboard.kpis.openRequests")}
          value={openRequests}
          icon={Inbox}
          trendPercent={computeTrendPercent(requestsRecent, requestsPrior)}
          trendCaption={t("dashboard.trend.vsLastPeriod")}
        />
        <KpiCard
          label={t("dashboard.kpis.tasksInProgress")}
          value={tasksInProgress}
          icon={ListChecks}
          trendPercent={computeTrendPercent(tasksRecent, tasksPrior)}
          trendCaption={t("dashboard.trend.vsLastPeriod")}
        />
        <KpiCard
          label={t("dashboard.kpis.deliverablesInReview")}
          value={deliverablesInReview}
          icon={PackageCheck}
          trendPercent={computeTrendPercent(deliverablesRecent, deliverablesPrior)}
          trendCaption={t("dashboard.trend.vsLastPeriod")}
        />
        <KpiCard
          label={t("dashboard.kpis.activeCampaigns")}
          value={activeCampaigns}
          icon={Megaphone}
          trendPercent={computeTrendPercent(campaignsRecent, campaignsPrior)}
          trendCaption={t("dashboard.trend.vsLastPeriod")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.projectProgress.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {inProgressProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.projectProgress.empty")}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {inProgressProjects.map((project) => {
                  const progress = computeProjectProgress(project.scopes[0]?.items ?? []);
                  return (
                    <div key={project.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                          {project.name}
                        </Link>
                        <span className="text-muted-foreground">{project.client.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProgressMeter percent={progress.percent} className="h-1.5" />
                        <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {progress.percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.requestActivity.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {openRequests === 0 && requestsByStatus.every((r) => r.count === 0) ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.requestActivity.empty")}</p>
            ) : (
              <ComparisonBarList
                rows={requestsByStatus.map((r) => ({
                  label: t(`requests.status.${r.status}`),
                  value: r.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.teamWorkload.title")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("dashboard.teamWorkload.subtitle")}</p>
          </CardHeader>
          <CardContent>
            {teamWorkload.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.teamWorkload.empty")}</p>
            ) : (
              <ComparisonBarList rows={teamWorkload} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.marketingPerformance.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeCampaignMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.marketingPerformance.empty")}</p>
            ) : (
              <CampaignMetricsGrid metric={{ ...aggregatedMetric, currency: "SAR" }} locale={locale} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
