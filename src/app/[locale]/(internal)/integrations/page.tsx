import { getTranslations } from "next-intl/server";
import { Plug } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { IntegrationCard } from "@/components/integrations/integration-card";

export default async function IntegrationsPage() {
  const t = await getTranslations("integrations");

  const integrations = await prisma.integration.findMany({
    orderBy: { updatedAt: "desc" },
    include: { client: { select: { companyName: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {integrations.length === 0 ? (
        <EmptyState icon={Plug} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      )}
    </div>
  );
}
