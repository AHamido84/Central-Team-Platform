import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * `trendPercent` is the real change in records created in the last 30 days
 * vs. the previous 30 days for this metric's underlying entity — never an
 * invented time series (see the dataviz skill guidance already applied in
 * Phase 1). `null` when there's nothing in the prior period to compare
 * against, in which case no trend is shown rather than a misleading 0%/∞.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  trendPercent,
  trendCaption,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trendPercent?: number | null;
  trendCaption?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {trendPercent !== undefined && trendPercent !== null && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "flex items-center gap-0.5 font-medium",
                trendPercent > 0 && "text-primary",
                trendPercent < 0 && "text-destructive",
                trendPercent === 0 && "text-muted-foreground",
              )}
            >
              {trendPercent > 0 && <ArrowUp className="size-3" />}
              {trendPercent < 0 && <ArrowDown className="size-3" />}
              {trendPercent > 0 ? "+" : ""}
              {trendPercent}%
            </span>
            {trendCaption && <span className="text-muted-foreground">{trendCaption}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
