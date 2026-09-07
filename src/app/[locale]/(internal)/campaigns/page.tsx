import { getTranslations, getLocale } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { CampaignMetricsGrid } from "@/components/portal/campaign-metrics-grid";
import { EditCampaignMetricsDialog } from "@/components/campaigns/edit-campaign-metrics-dialog";
import { formatDate } from "@/lib/format-date";

export default async function InternalCampaignsPage() {
  const t = await getTranslations("campaigns");
  const locale = await getLocale();

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      metric: true,
      project: { select: { id: true, name: true, client: { select: { id: true, companyName: true } } } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("internalTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("internalSubtitle")}</p>
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
                  <Link href={`/clients/${campaign.project.client.id}`} className="hover:underline">
                    {campaign.project.client.companyName}
                  </Link>
                  {" · "}
                  <Link href={`/projects/${campaign.project.id}`} className="hover:underline">
                    {campaign.project.name}
                  </Link>
                  {" · "}
                  {t(`platform.${campaign.platform}`)}
                  {" · "}
                  {formatDate(campaign.startDate, locale)} – {formatDate(campaign.endDate, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t(`status.${campaign.status}`)}</Badge>
                <EditCampaignMetricsDialog
                  campaignId={campaign.id}
                  projectId={campaign.project.id}
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
