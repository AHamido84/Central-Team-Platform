import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { WorkspaceTabs } from "@/components/portal/workspace-tabs";
import { Badge } from "@/components/ui/badge";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations();
  const tStatus = await getTranslations("projects.status");

  const campaignCount = await prisma.campaign.count({ where: { projectId: id } });

  const base = `/portal/projects/${id}`;
  const tabs = [
    { href: base, label: t("nav.workspace.overview") },
    { href: `${base}/scope`, label: t("nav.workspace.scope") },
    { href: `${base}/requests`, label: t("nav.workspace.requests") },
    { href: `${base}/tasks`, label: t("nav.workspace.tasks") },
    { href: `${base}/deliverables`, label: t("nav.workspace.deliverables") },
    { href: `${base}/files`, label: t("nav.workspace.files") },
    ...(campaignCount > 0
      ? [{ href: `${base}/campaigns`, label: t("nav.workspace.campaigns") }]
      : []),
    { href: `${base}/reports`, label: t("nav.workspace.reports") },
    { href: `${base}/activity`, label: t("nav.workspace.activity") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageBreadcrumb
        items={[{ label: t("projects.title"), href: "/portal/projects" }, { label: project.name }]}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.projectType.name}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {tStatus(project.status)}
        </Badge>
      </div>
      <WorkspaceTabs tabs={tabs} />
      <div>{children}</div>
    </div>
  );
}
