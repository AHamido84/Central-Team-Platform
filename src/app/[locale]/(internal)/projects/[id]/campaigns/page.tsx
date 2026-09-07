import { getTranslations, getLocale } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { CampaignMetricsGrid } from "@/components/portal/campaign-metrics-grid";
import { AddCampaignDialog } from "@/components/campaigns/add-campaign-dialog";
import { EditCampaignMetricsDialog } from "@/components/campaigns/edit-campaign-metrics-dialog";
import { formatDate } from "@/lib/format-date";

export default async function InternalProjectCampaignsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("campaigns");
  const locale = await getLocale();

  const campaigns = await prisma.campaign.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { metric: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddCampaignDialog projectId={id} />
      </div>
      {campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{campaign.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t(`platform.${campaign.platform}`)}
                  {" · "}
                  {formatDate(campaign.startDate, locale)} – {formatDate(campaign.endDate, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t(`status.${campaign.status}`)}</Badge>
                <EditCampaignMetricsDialog
                  campaignId={campaign.id}
                  projectId={id}
                  defaultValues={
                    campaign.metric
                      ? {
                          spend: campaign.metric.spend.toNumber(),
                          impressions: campaign.metric.impressions,
                          reach: campaign.metric.reach,
                          clicks: campaign.metric.clicks,
                          leads: campaign.metric.leads,
                          conversions: campaign.metric.conversions,
                          revenue: campaign.metric.revenue.toNumber(),
                        }
                      : undefined
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              {campaign.metric ? (
                <CampaignMetricsGrid
                  metric={{
                    spend: campaign.metric.spend.toNumber(),
                    impressions: campaign.metric.impressions,
                    reach: campaign.metric.reach,
                    clicks: campaign.metric.clicks,
                    leads: campaign.metric.leads,
                    conversions: campaign.metric.conversions,
                    revenue: campaign.metric.revenue.toNumber(),
                    currency: campaign.metric.currency,
                  }}
                  locale={locale}
                />
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
