import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ActivityTimeline } from "@/components/portal/activity-timeline";
import { EmptyState } from "@/components/portal/empty-state";
import { History, FolderKanban } from "lucide-react";
import { ContractDeleteButton } from "@/components/contracts/contract-delete-button";
import { formatDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("contracts");
  const tActivity = await getTranslations("activity");
  const locale = await getLocale();

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, companyName: true } },
      projects: {
        select: { id: true, name: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!contract) notFound();

  const auditEntries = await prisma.auditLog.findMany({
    where: { entityType: "Contract", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: t("title"), href: "/contracts" },
          { label: contract.title },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{contract.title}</h1>
            <Badge variant="secondary">{t(`status.${contract.status}`)}</Badge>
          </div>
          <Link href={`/clients/${contract.client.id}`} className="text-sm text-muted-foreground hover:underline">
            {contract.client.companyName}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/contracts/${contract.id}/edit`}>
                <Pencil className="size-4" />
                {t("editTitle")}
              </Link>
            }
          />
          <ContractDeleteButton contractId={contract.id} clientId={contract.client.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("detail.infoTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <InfoRow label={t("fields.contractNumber")} value={contract.contractNumber} />
            <InfoRow label={t("fields.type")} value={contract.type} />
            <InfoRow label={t("fields.startDate")} value={formatDate(contract.startDate, locale)} />
            <InfoRow label={t("fields.endDate")} value={formatDate(contract.endDate, locale)} />
            <InfoRow
              label={t("fields.value")}
              value={contract.value ? `${contract.value.toString()} ${contract.currency ?? ""}` : undefined}
            />
            <InfoRow label={t("fields.paymentTerms")} value={contract.paymentTerms} />
            {contract.notes && (
              <div className="pt-2">
                <p className="text-muted-foreground">{t("fields.notes")}</p>
                <p className="mt-1 whitespace-pre-wrap">{contract.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.projectsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.projects.length === 0 ? (
              <EmptyState icon={FolderKanban} title={t("empty.title")} />
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {contract.projects.map((project) => (
                  <li key={project.id} className="py-2">
                    <Link href={`/projects/${project.id}`} className="text-sm font-medium hover:underline">
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" />
            {tActivity("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ActivityTimeline
              entries={auditEntries.map((entry) => ({
                id: entry.id,
                action: entry.action,
                createdAtLabel: formatDate(entry.createdAt, locale),
              }))}
              labelFor={(action) => tActivity(`actions.${action}`)}
            />
          )}
        </CardContent>
      </Card>
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
