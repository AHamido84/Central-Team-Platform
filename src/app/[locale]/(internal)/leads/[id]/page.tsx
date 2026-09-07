import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { LeadStatusSelect } from "@/components/leads/lead-status-select";
import { formatDate } from "@/lib/format-date";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("leads");
  const locale = await getLocale();

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, companyName: true } },
      project: { select: { id: true, name: true } },
      campaign: { select: { name: true } },
      assignedTo: { select: { name: true } },
      opportunities: { select: { id: true, title: true, stage: true } },
    },
  });

  if (!lead) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: t("title"), href: "/leads" }, { label: lead.name }]} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{lead.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <InfoRow label={t("fields.client")} value={
              <Link href={`/clients/${lead.client.id}`} className="hover:underline">
                {lead.client.companyName}
              </Link>
            } />
            <InfoRow label={t("fields.email")} value={lead.email} />
            <InfoRow label={t("fields.phone")} value={lead.phone} />
            <InfoRow label={t("fields.source")} value={lead.source} />
            <InfoRow label={t("fields.project")} value={lead.project?.name} />
            <InfoRow label={t("fields.campaign")} value={lead.campaign?.name} />
            <InfoRow label={t("fields.assignee")} value={lead.assignedTo?.name} />
            <InfoRow label={t("fields.createdAt")} value={formatDate(lead.createdAt, locale)} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("fields.status")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
            </CardContent>
          </Card>

          {lead.opportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y divide-border">
                  {lead.opportunities.map((opp) => (
                    <li key={opp.id} className="py-2 text-sm">
                      {opp.title}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value ?? "—"}</span>
    </div>
  );
}
