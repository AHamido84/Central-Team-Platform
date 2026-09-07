import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Building2, Inbox, ListChecks, PackageCheck, FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/portal/stat-card";
import { ProjectCard } from "@/components/portal/project-card";
import { EmptyState } from "@/components/portal/empty-state";
import { computeProjectProgress } from "@/lib/project-progress";
import { formatDate } from "@/lib/format-date";
import { OPEN_REQUEST_STATUSES } from "@/lib/request-status";

export default async function PortalDashboardPage() {
  const sessionUser = await requireUser();
  const t = await getTranslations();
  const locale = await getLocale();

  const clientId = sessionUser.clientId;
  if (!clientId) {
    return null;
  }

  const [user, activeProjects, openRequests, inProgressTasks, deliverablesInReview, projects] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { name: true } }),
      prisma.project.count({
        where: { clientId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
      prisma.request.count({
        where: { clientId, status: { in: OPEN_REQUEST_STATUSES } },
      }),
      prisma.task.count({
        where: {
          project: { clientId },
          clientVisible: true,
          status: { in: ["IN_PROGRESS", "IN_REVIEW"] },
        },
      }),
      prisma.deliverable.count({
        where: { project: { clientId }, status: "IN_REVIEW" },
      }),
      prisma.project.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          projectType: true,
          scopes: {
            orderBy: { version: "desc" },
            take: 1,
            include: { items: { select: { quantity: true, status: true } } },
          },
          _count: { select: { deliverables: true } },
          requests: { where: { status: { in: OPEN_REQUEST_STATUSES } }, select: { id: true } },
        },
      }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.greeting", { name: user.name })}
        </h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("dashboard.stats.activeProjects")} value={activeProjects} icon={FolderKanban} />
        <StatCard label={t("dashboard.stats.openRequests")} value={openRequests} icon={Inbox} />
        <StatCard label={t("dashboard.stats.inProgressTasks")} value={inProgressTasks} icon={ListChecks} />
        <StatCard
          label={t("dashboard.stats.deliverablesInReview")}
          value={deliverablesInReview}
          icon={PackageCheck}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t("dashboard.projectsOverview")}</h2>
          {projects.length > 0 && (
            <Link href="/portal/projects" className="text-sm text-primary hover:underline">
              {t("dashboard.viewAllProjects")}
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t("projects.empty.title")}
            description={t("projects.empty.description")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const progress = computeProjectProgress(project.scopes[0]?.items ?? []);
              return (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  projectTypeName={project.projectType.name}
                  statusLabel={t(`projects.status.${project.status}`)}
                  progressPercent={progress.percent}
                  startDateLabel={formatDate(project.startDate, locale)}
                  dueDateLabel={formatDate(project.dueDate, locale)}
                  scopeItemCount={project.scopes[0]?.items.length ?? 0}
                  deliverableCount={project._count.deliverables}
                  openRequestCount={project.requests.length}
                  fields={{
                    progress: t("projects.card.progress"),
                    startDate: t("projects.card.startDate"),
                    dueDate: t("projects.card.dueDate"),
                    scopeItems: t("projects.card.scopeItems"),
                    deliverables: t("projects.card.deliverables"),
                    openRequests: t("projects.card.openRequests"),
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
