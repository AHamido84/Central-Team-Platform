import { getTranslations } from "next-intl/server";

export type RequestTimelineEntry =
  | { id: string; type: "created"; atLabel: string }
  | { id: string; type: "statusChanged"; atLabel: string; status: string }
  | { id: string; type: "assigned"; atLabel: string; name: string };

/**
 * The request lifecycle is computed (createdAt → status → matching AuditLog
 * entries), not a stored state machine — see the Phase 1.5 plan's scope
 * notes on why RequestStatus stays a 5-value enum.
 */
export async function RequestTimeline({ entries }: { entries: RequestTimelineEntry[] }) {
  const t = await getTranslations("requests.timeline");
  const tStatus = await getTranslations("requests.status");

  return (
    <ol className="relative flex flex-col gap-6 ps-6">
      <div className="absolute inset-y-0 start-[7px] w-px bg-border" aria-hidden />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute start-[-24px] top-1 size-[15px] rounded-full border-2 border-primary bg-background" />
          <p className="text-sm font-medium text-foreground">
            {entry.type === "created" && t("created")}
            {entry.type === "statusChanged" &&
              t("statusChanged", { status: tStatus(entry.status) })}
            {entry.type === "assigned" && t("assigned", { name: entry.name })}
          </p>
          <p className="text-xs text-muted-foreground">{entry.atLabel}</p>
        </li>
      ))}
    </ol>
  );
}
