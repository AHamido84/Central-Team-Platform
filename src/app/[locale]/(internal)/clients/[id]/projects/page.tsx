import { getTranslations } from "next-intl/server";
import { FolderKanban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getLocale } from "next-intl/server";
import { ProjectCard } from "@/components/portal/project-card";
import { EmptyState } from "@/components/portal/empty-state";
import { computeProjectProgress } from "@/lib/project-progress";
import { formatDate } from "@/lib/format-date";
import { OPEN_REQUEST_STATUSES } from "@/lib/request-status";

export default async function ClientProjectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();

  const projects = await prisma.project.findMany({
    where: { clientId: id },
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
  });

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={t("projects.empty.title")}
        description={t("projects.empty.description")}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const progress = computeProjectProgress(project.scopes[0]?.items ?? []);
        return (
          <ProjectCard
            key={project.id}
            id={project.id}
            basePath=""
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
  );
}
