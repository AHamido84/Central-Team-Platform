import { getTranslations } from "next-intl/server";
import { Check, ListChecks } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { ProgressMeter } from "@/components/portal/progress-meter";
import { EmptyState } from "@/components/portal/empty-state";
import type { ScopeItemCategory, ScopeItemStatus } from "@prisma/client";

type CategoryGroup = {
  category: ScopeItemCategory;
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  dominantStatus: ScopeItemStatus;
};

function groupByCategory(items: { category: ScopeItemCategory; quantity: number | null; status: ScopeItemStatus }[]) {
  const byCategory = new Map<ScopeItemCategory, CategoryGroup>();
  for (const item of items) {
    if (item.status === "CANCELLED") continue;
    const qty = item.quantity ?? 1;
    const group = byCategory.get(item.category) ?? {
      category: item.category,
      total: 0,
      completed: 0,
      inProgress: 0,
      planned: 0,
      dominantStatus: "PLANNED" as ScopeItemStatus,
    };
    group.total += qty;
    if (item.status === "COMPLETED") group.completed += qty;
    else if (item.status === "IN_PROGRESS") group.inProgress += qty;
    else group.planned += qty;
    byCategory.set(item.category, group);
  }
  for (const group of byCategory.values()) {
    group.dominantStatus =
      group.completed === group.total ? "COMPLETED" : group.inProgress > 0 ? "IN_PROGRESS" : "PLANNED";
  }
  return Array.from(byCategory.values());
}

export default async function ProjectScopePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations("projects.scope");

  const scope = await prisma.projectScope.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
    include: { items: { select: { category: true, quantity: true, status: true } } },
  });

  const groups = groupByCategory(scope?.items ?? []);

  if (groups.length === 0) {
    return <EmptyState icon={ListChecks} title={t("empty")} />;
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
      {groups.map((group) => {
        const percent = group.total === 0 ? 0 : Math.round((group.completed / group.total) * 100);
        const isComplete = group.dominantStatus === "COMPLETED";
        return (
          <div key={group.category} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {isComplete ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
              ) : (
                <span className="size-5" />
              )}
              <span className="font-medium">{t(`category.${group.category}`)}</span>
            </div>
            <div className="flex items-center gap-3 sm:w-64">
              {isComplete ? (
                <span className="text-sm font-medium text-primary">{t("status.COMPLETED")}</span>
              ) : (
                <>
                  <ProgressMeter percent={percent} className="h-1.5" />
                  <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                    {group.completed} / {group.total}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
