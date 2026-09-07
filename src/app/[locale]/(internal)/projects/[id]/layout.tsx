import { getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInternalProjectOrNotFound } from "@/lib/internal-project";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { WorkspaceTabs } from "@/components/portal/workspace-tabs";
import { ProjectHeaderActions } from "@/components/projects/project-header-actions";
import { prisma } from "@/lib/prisma";

export default async function InternalProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getInternalProjectOrNotFound(id);
  const t = await getTranslations();
  const tStatus = await getTranslations("projects.status");

  const campaignCount = await prisma.campaign.count({ where: { projectId: id } });

  const base = `/projects/${id}`;
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
        items={[
          { label: t("clients.title"), href: "/clients" },
          { label: project.client.companyName, href: `/clients/${project.client.id}` },
          { label: project.name },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <Badge variant="secondary">{tStatus(project.status)}</Badge>
          </div>
          <Link href={`/clients/${project.client.id}`} className="text-sm text-muted-foreground hover:underline">
            {project.client.companyName}
          </Link>
          <span className="text-sm text-muted-foreground"> · {project.projectType.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href={`/requests/new?projectId=${project.id}`}>{t("requests.newButton")}</Link>} />
          <Button size="sm" variant="outline" render={<Link href={`${base}/tasks`}>{t("tasks.newButton")}</Link>} />
          <Button size="sm" variant="outline" render={<Link href={`${base}/deliverables`}>{t("deliverables.newButton")}</Link>} />
          <Button size="sm" variant="outline" render={<Link href={`${base}/campaigns`}>{t("campaigns.newButton")}</Link>} />
          <Button
            size="sm"
            render={
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil className="size-4" />
                {t("common.actions.edit")}
              </Link>
            }
          />
          <ProjectHeaderActions
            projectId={project.id}
            clientId={project.client.id}
            isArchived={project.status === "ARCHIVED"}
          />
        </div>
      </div>
      <WorkspaceTabs tabs={tabs} />
      <div>{children}</div>
    </div>
  );
}
