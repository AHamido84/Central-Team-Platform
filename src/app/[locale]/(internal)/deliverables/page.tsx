import { getTranslations } from "next-intl/server";
import { PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeliverableCard } from "@/components/portal/deliverable-card";
import { DeliverableFilterTabs } from "@/components/portal/deliverable-filter-tabs";
import { EmptyState } from "@/components/portal/empty-state";
import { UploadDeliverableDialog } from "@/components/deliverables/upload-deliverable-dialog";
import type { ScopeItemCategory } from "@prisma/client";

export default async function InternalDeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const t = await getTranslations("deliverables");

  const [deliverables, projects] = await Promise.all([
    prisma.deliverable.findMany({
      where: { category: category ? (category as ScopeItemCategory) : undefined },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { id: true, name: true } }, assets: true },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("internalTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("internalSubtitle")}</p>
        </div>
        <UploadDeliverableDialog projects={projects.map((p) => ({ id: p.id, label: p.name }))} />
      </div>

      <DeliverableFilterTabs basePath="/deliverables" active={category} />

      {deliverables.length === 0 ? (
        <EmptyState icon={PackageCheck} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((deliverable) => (
            <DeliverableCard key={deliverable.id} deliverable={deliverable} showProject basePath="" />
          ))}
        </div>
      )}
    </div>
  );
}
