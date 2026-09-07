import type { ActivityAction } from "@/lib/activity-actions";

export type ActivityEntry = {
  id: string;
  action: ActivityAction | string;
  createdAtLabel: string;
};

export function ActivityTimeline({
  entries,
  labelFor,
}: {
  entries: ActivityEntry[];
  labelFor: (action: string) => string;
}) {
  return (
    <ol className="relative flex flex-col gap-6 ps-6">
      <div className="absolute inset-y-0 start-[7px] w-px bg-border" aria-hidden />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute start-[-24px] top-1 size-[15px] rounded-full border-2 border-primary bg-background" />
          <p className="text-sm font-medium text-foreground">{labelFor(entry.action)}</p>
          <p className="text-xs text-muted-foreground">{entry.createdAtLabel}</p>
        </li>
      ))}
    </ol>
  );
}
