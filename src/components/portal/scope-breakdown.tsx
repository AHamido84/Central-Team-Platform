import { getTranslations } from "next-intl/server";
import { Check, ListChecks } from "lucide-react";
import { ProgressMeter } from "@/components/portal/progress-meter";
import { EmptyState } from "@/components/portal/empty-state";
import { groupScopeItemsByCategory } from "@/lib/group-scope-items";
import type { ScopeItemCategory, ScopeItemStatus } from "@prisma/client";

export async function ScopeBreakdown({
  items,
}: {
  items: { category: ScopeItemCategory; quantity: number | null; status: ScopeItemStatus }[];
}) {
  const t = await getTranslations("projects.scope");
  const groups = groupScopeItemsByCategory(items);

  if (groups.length === 0) {
    return <EmptyState icon={ListChecks} title={t("empty")} />;
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
      {groups.map((group) => {
        const percent = group.total === 0 ? 0 : Math.round((group.completed / group.total) * 100);
        const isComplete = group.dominantStatus === "COMPLETED";
        return (
          <div
            key={group.category}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
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
