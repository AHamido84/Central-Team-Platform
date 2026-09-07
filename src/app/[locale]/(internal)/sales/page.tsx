import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { OpportunitiesBoard } from "@/components/sales/opportunities-board";
import { AddOpportunityDialog } from "@/components/sales/add-opportunity-dialog";
import { EmptyState } from "@/components/portal/empty-state";
import { formatCurrency } from "@/lib/format-date";
import { TrendingUp } from "lucide-react";
import type { OpportunityStage } from "@prisma/client";

const STAGES: OpportunityStage[] = ["NEW", "QUALIFYING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

export default async function SalesPipelinePage() {
  const t = await getTranslations("sales");
  const tStage = await getTranslations("sales.stage");
  const locale = await getLocale();

  const [opportunities, clients, internalUsers] = await Promise.all([
    prisma.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { companyName: true } } },
    }),
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddOpportunityDialog
          clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
          owners={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
        />
      </div>

      {opportunities.length === 0 ? (
        <EmptyState icon={TrendingUp} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <OpportunitiesBoard
          columns={STAGES.map((stage) => ({ id: stage, label: tStage(stage) }))}
          opportunities={opportunities.map((opp) => ({
            id: opp.id,
            stage: opp.stage,
            title: opp.title,
            clientName: opp.client.companyName,
            valueLabel: opp.value ? formatCurrency(opp.value.toNumber(), opp.currency ?? "SAR", locale) : undefined,
          }))}
        />
      )}
    </div>
  );
}
