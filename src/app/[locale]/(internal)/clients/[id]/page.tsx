import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Pencil, Plus } from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const t = await getTranslations("clients");
  const tProjects = await getTranslations("projects");
  const tStatus = await getTranslations("clients.status");
  const tProjectStatus = await getTranslations("projects.status");
  const tCommon = await getTranslations("common");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      accountManager: { select: { name: true } },
      contacts: true,
      projects: {
        orderBy: { createdAt: "desc" },
        include: { projectType: true },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[{ label: t("title"), href: "/clients" }, { label: client.companyName }]}
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.companyName}</h1>
          {client.industry && (
            <p className="text-sm text-muted-foreground">{client.industry}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{tStatus(client.status)}</Badge>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/clients/${client.id}/edit`}>
                <Pencil className="size-4" />
                {tCommon("actions.edit")}
              </Link>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("detail.projectsTitle")}</CardTitle>
            <Button
              size="sm"
              render={
                <Link href={`/projects/new?clientId=${client.id}`}>
                  <Plus className="size-4" />
                  {tProjects("createButton")}
                </Link>
              }
            />
          </CardHeader>
          <CardContent>
            {client.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tProjects("empty.description")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {client.projects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                        {project.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{project.projectType.name}</p>
                    </div>
                    <Badge variant="secondary">{tProjectStatus(project.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fields.companyName")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <InfoRow label={t("fields.legalName")} value={client.legalName} />
            <InfoRow label={t("fields.website")} value={client.website} />
            <InfoRow label={t("fields.email")} value={client.email} />
            <InfoRow label={t("fields.phone")} value={client.phone} />
            <InfoRow label={t("fields.accountManager")} value={client.accountManager?.name} />
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
