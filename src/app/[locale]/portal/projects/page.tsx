import { getTranslations, getLocale } from "next-intl/server";
import { FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/components/portal/project-card";
import { EmptyState } from "@/components/portal/empty-state";
import { computeProjectProgress } from "@/lib/project-progress";
import { formatDate } from "@/lib/format-date";
import { OPEN_REQUEST_STATUSES } from "@/lib/request-status";

export default async function PortalProjectsPage() {
  const sessionUser = await requireUser();
  const t = await getTranslations();
  const locale = await getLocale();

  const clientId = sessionUser.clientId;

  // Client-portal users only ever see their own client's projects — the
  // clientId comes from the session (user.clientId), never from the
  // request. See ARCHITECTURE.md §5.
  const projects = clientId
    ? await prisma.project.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
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
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("projects.title")}</h1>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
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
  );
}
