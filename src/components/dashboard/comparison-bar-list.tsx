import { ProgressMeter } from "@/components/portal/progress-meter";

export type ComparisonBarRow = { label: string; value: number };

/** Horizontal bars scaled to the largest value in the set — for counts that
 * are meaningfully compared to each other (requests per status, tasks per
 * assignee), not a percent-of-total metric. No invented data: `value` is
 * always a real count passed in by the caller. */
export function ComparisonBarList({ rows }: { rows: ComparisonBarRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-muted-foreground">{row.label}</span>
          <ProgressMeter percent={(row.value / max) * 100} className="h-2" />
          <span className="w-8 shrink-0 text-end text-sm font-medium tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
