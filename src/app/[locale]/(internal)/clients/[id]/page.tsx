import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/portal/stat-card";
import { prisma } from "@/lib/prisma";
import { getClientOrNotFound } from "@/lib/internal-client";
import { OPEN_REQUEST_STATUSES } from "@/lib/request-status";
import { FolderKanban, Inbox, Megaphone } from "lucide-react";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientOrNotFound(id);
  const t = await getTranslations("clients");
  const tRequests = await getTranslations("requests");
  const tCampaigns = await getTranslations("campaigns");

  const [projectCount, openRequestCount, campaignCount, contacts] = await Promise.all([
    prisma.project.count({ where: { clientId: id } }),
    prisma.request.count({ where: { clientId: id, status: { in: OPEN_REQUEST_STATUSES } } }),
    prisma.campaign.count({ where: { project: { clientId: id } } }),
    prisma.clientContact.findMany({ where: { clientId: id }, orderBy: { isPrimary: "desc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("detail.projectsTitle")} value={projectCount} icon={FolderKanban} />
        <StatCard label={tRequests("title")} value={openRequestCount} icon={Inbox} />
        <StatCard label={tCampaigns("title")} value={campaignCount} icon={Megaphone} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("fields.companyName")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <InfoRow label={t("fields.legalName")} value={client.legalName} />
            <InfoRow label={t("fields.industry")} value={client.industry} />
            <InfoRow label={t("fields.website")} value={client.website} />
            <InfoRow label={t("fields.email")} value={client.email} />
            <InfoRow label={t("fields.phone")} value={client.phone} />
            <InfoRow label={t("fields.accountManager")} value={client.accountManager?.name} />
            {client.notes && (
              <div className="pt-2">
                <p className="text-muted-foreground">{t("fields.notes")}</p>
                <p className="mt-1 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.contactsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {contacts.map((contact) => (
                  <li key={contact.id} className="flex flex-col gap-0.5 py-2">
                    <span className="text-sm font-medium">{contact.name}</span>
                    {contact.position && (
                      <span className="text-xs text-muted-foreground">{contact.position}</span>
                    )}
                    {contact.email && (
                      <span className="text-xs text-muted-foreground">{contact.email}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
