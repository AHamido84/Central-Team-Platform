import { getTranslations } from "next-intl/server";
import { PackageCheck } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { DeliverableCard } from "@/components/portal/deliverable-card";
import { DeliverableFilterTabs } from "@/components/portal/deliverable-filter-tabs";
import type { ScopeItemCategory } from "@prisma/client";

export default async function PortalDeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await requireUser();
  const { category } = await searchParams;
  const t = await getTranslations("deliverables");

  const clientId = user.clientId;
  const deliverables = clientId
    ? await prisma.deliverable.findMany({
        where: {
          project: { clientId },
          ...(category ? { category: category as ScopeItemCategory } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { assets: true, project: { select: { id: true, name: true } } },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <DeliverableFilterTabs basePath="/portal/deliverables" active={category} />
      {deliverables.length === 0 ? (
        <EmptyState icon={PackageCheck} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {deliverables.map((deliverable) => (
            <DeliverableCard key={deliverable.id} deliverable={deliverable} showProject />
          ))}
        </div>
      )}
    </div>
  );
}
