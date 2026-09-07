import { getTranslations } from "next-intl/server";
import { StatCard } from "@/components/portal/stat-card";
import { formatNumber, formatCurrency } from "@/lib/format-date";
import { computeCTR, computeCPC, computeCPL, computeROAS } from "@/lib/campaign-metrics";
import {
  DollarSign,
  Eye,
  Users,
  MousePointerClick,
  Percent,
  UserPlus,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export async function CampaignMetricsGrid({
  metric,
  locale,
}: {
  metric: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    leads: number;
    conversions: number;
    revenue: number;
    currency: string;
  };
  locale: string;
}) {
  const t = await getTranslations("campaigns.metrics");

  const ctr = computeCTR(metric.clicks, metric.impressions);
  const cpc = computeCPC(metric.spend, metric.clicks);
  const cpl = computeCPL(metric.spend, metric.leads);
  const roas = computeROAS(metric.revenue, metric.spend);

  const money = (value: number) => formatCurrency(value, metric.currency, locale);
  const dash = "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label={t("spend")} value={money(metric.spend)} icon={DollarSign} />
      <StatCard label={t("impressions")} value={formatNumber(metric.impressions, locale)} icon={Eye} />
      <StatCard label={t("reach")} value={formatNumber(metric.reach, locale)} icon={Users} />
      <StatCard label={t("clicks")} value={formatNumber(metric.clicks, locale)} icon={MousePointerClick} />
      <StatCard label={t("ctr")} value={ctr === null ? dash : `${ctr.toFixed(2)}%`} icon={Percent} />
      <StatCard label={t("cpc")} value={cpc === null ? dash : money(cpc)} icon={DollarSign} />
      <StatCard label={t("leads")} value={formatNumber(metric.leads, locale)} icon={UserPlus} />
      <StatCard label={t("cpl")} value={cpl === null ? dash : money(cpl)} icon={DollarSign} />
      <StatCard label={t("conversions")} value={formatNumber(metric.conversions, locale)} icon={CheckCircle} />
      <StatCard label={t("revenue")} value={money(metric.revenue)} icon={DollarSign} />
      <StatCard label={t("roas")} value={roas === null ? dash : `${roas.toFixed(2)}x`} icon={TrendingUp} />
    </div>
  );
}
