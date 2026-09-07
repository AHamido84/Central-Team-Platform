import { getTranslations, getLocale } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { CampaignMetricsGrid } from "@/components/portal/campaign-metrics-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";

export default async function ProjectCampaignsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations("campaigns");
  const locale = await getLocale();

  const campaigns = await prisma.campaign.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { metric: true },
  });

  if (campaigns.length === 0) {
    return <EmptyState icon={Megaphone} title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {campaigns.map((campaign) => (
        <div key={campaign.id} className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{campaign.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{campaign.objective}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="secondary">{t(`platform.${campaign.platform}`)}</Badge>
                <Badge variant="secondary">{t(`status.${campaign.status}`)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>
                {t("fields.startDate")}: {formatDate(campaign.startDate, locale)}
              </span>
              <span>
                {t("fields.endDate")}: {formatDate(campaign.endDate, locale)}
              </span>
            </CardContent>
          </Card>

          {campaign.metric && (
            <CampaignMetricsGrid
              metric={{
                spend: Number(campaign.metric.spend),
                impressions: campaign.metric.impressions,
                reach: campaign.metric.reach,
                clicks: campaign.metric.clicks,
                leads: campaign.metric.leads,
                conversions: campaign.metric.conversions,
                revenue: Number(campaign.metric.revenue),
                currency: campaign.metric.currency,
              }}
              locale={locale}
            />
          )}
        </div>
      ))}
    </div>
  );
}
