import { getTranslations } from "next-intl/server";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProgressMeter } from "@/components/portal/progress-meter";
import { EmptyState } from "@/components/portal/empty-state";
import { groupScopeItemsByCategory, type ScopeGroupableItem } from "@/lib/group-scope-items";

export async function ScopeBreakdown({
  items,
  taskStatsByItemId,
}: {
  items: ScopeGroupableItem[];
  taskStatsByItemId?: Map<string, { total: number; done: number }>;
}) {
  const t = await getTranslations("projects.scope");
  const groups = groupScopeItemsByCategory(items, taskStatsByItemId);

  if (groups.length === 0) {
    return <EmptyState icon={ListChecks} title={t("empty")} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.item")}</TableHead>
            <TableHead>{t("fields.unit")}</TableHead>
            <TableHead>{t("table.contracted")}</TableHead>
            <TableHead>{t("table.completed")}</TableHead>
            <TableHead>{t("table.remaining")}</TableHead>
            <TableHead>{t("fields.status")}</TableHead>
            <TableHead className="w-44">{t("table.percent")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const percent = group.total === 0 ? 0 : Math.round((group.completed / group.total) * 100);
            return (
              <TableRow key={group.category}>
                <TableCell className="font-medium">{t(`category.${group.category}`)}</TableCell>
                <TableCell className="text-muted-foreground">{group.unit ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{group.total}</TableCell>
                <TableCell className="tabular-nums text-primary">{group.completed}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{group.remaining}</TableCell>
                <TableCell>
                  <Badge variant={group.dominantStatus === "COMPLETED" ? "default" : "secondary"}>
                    {t(`status.${group.dominantStatus}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ProgressMeter percent={percent} className="h-1.5" />
                    <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {percent}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
