import { getTranslations } from "next-intl/server";
import { PackageCheck } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { DeliverableCard } from "@/components/portal/deliverable-card";
import { DeliverableFilterTabs } from "@/components/portal/deliverable-filter-tabs";
import type { ScopeItemCategory } from "@prisma/client";

export default async function ProjectDeliverablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { category } = await searchParams;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations("deliverables");

  const deliverables = await prisma.deliverable.findMany({
    where: {
      projectId: id,
      ...(category ? { category: category as ScopeItemCategory } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { assets: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <DeliverableFilterTabs basePath={`/portal/projects/${id}/deliverables`} active={category} />
      {deliverables.length === 0 ? (
        <EmptyState icon={PackageCheck} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {deliverables.map((deliverable) => (
            <DeliverableCard key={deliverable.id} deliverable={deliverable} showProject={false} />
          ))}
        </div>
      )}
    </div>
  );
}
