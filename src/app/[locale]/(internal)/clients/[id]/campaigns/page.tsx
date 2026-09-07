import { getTranslations, getLocale } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { CampaignMetricsGrid } from "@/components/portal/campaign-metrics-grid";
import { formatDate } from "@/lib/format-date";

export default async function ClientCampaignsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("campaigns");
  const locale = await getLocale();

  const campaigns = await prisma.campaign.findMany({
    where: { project: { clientId: id } },
    orderBy: { createdAt: "desc" },
    include: { metric: true, project: { select: { id: true, name: true } } },
  });

  if (campaigns.length === 0) {
    return <EmptyState icon={Megaphone} title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                <Link href={`/projects/${campaign.project.id}`} className="hover:underline">
                  {campaign.project.name}
                </Link>
                {" · "}
                {t(`platform.${campaign.platform}`)}
                {" · "}
                {formatDate(campaign.startDate, locale)} – {formatDate(campaign.endDate, locale)}
              </p>
            </div>
            <Badge variant="secondary">{t(`status.${campaign.status}`)}</Badge>
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
      ))}
    </div>
  );
}
