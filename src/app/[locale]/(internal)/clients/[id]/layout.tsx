import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getClientOrNotFound } from "@/lib/internal-client";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { WorkspaceTabs } from "@/components/portal/workspace-tabs";
import { prisma } from "@/lib/prisma";

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ClientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientOrNotFound(id);
  const t = await getTranslations();
  const tStatus = await getTranslations("clients.status");

  const campaignCount = await prisma.campaign.count({ where: { project: { clientId: id } } });

  const base = `/clients/${id}`;
  const tabs = [
    { href: base, label: t("nav.workspace.overview") },
    { href: `${base}/projects`, label: t("nav.workspace.projects") },
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
        items={[{ label: t("clients.title"), href: "/clients" }, { label: client.companyName }]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initialsFor(client.companyName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{client.companyName}</h1>
              <Badge variant="secondary">{tStatus(client.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {client.accountManager?.name ?? "—"}
              {client.industry ? ` · ${client.industry}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/projects/new?clientId=${client.id}`}>
                <Plus className="size-4" />
                {t("projects.createButton")}
              </Link>
            }
          />
          <Button
            size="sm"
            render={
              <Link href={`/requests/new?clientId=${client.id}`}>
                <Plus className="size-4" />
                {t("requests.newButton")}
              </Link>
            }
          />
        </div>
      </div>
      <WorkspaceTabs tabs={tabs} />
      <div>{children}</div>
    </div>
  );
}
