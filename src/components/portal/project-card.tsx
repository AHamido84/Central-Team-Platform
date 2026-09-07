import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { ProgressMeter } from "./progress-meter";

export function ProjectCard({
  id,
  name,
  projectTypeName,
  clientName,
  statusLabel,
  progressPercent,
  startDateLabel,
  dueDateLabel,
  scopeItemCount,
  deliverableCount,
  openRequestCount,
  fields,
  basePath = "/portal",
}: {
  id: string;
  name: string;
  projectTypeName: string;
  /** Shown for internal users, who manage many clients at once. */
  clientName?: string;
  statusLabel: string;
  progressPercent: number;
  startDateLabel: string;
  dueDateLabel: string;
  scopeItemCount: number;
  deliverableCount: number;
  openRequestCount: number;
  fields: {
    progress: string;
    startDate: string;
    dueDate: string;
    scopeItems: string;
    deliverables: string;
    openRequests: string;
  };
  /** "" for internal, "/portal" for the client portal. */
  basePath?: string;
}) {
  return (
    <Link
      href={`${basePath}/projects/${id}`}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-card-foreground">{name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {clientName ? `${clientName} · ${projectTypeName}` : projectTypeName}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {statusLabel}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">{fields.progress}</span>
          <span className="text-sm font-semibold tabular-nums">{progressPercent}%</span>
        </div>
        <ProgressMeter percent={progressPercent} />
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <StatBit value={scopeItemCount} label={fields.scopeItems} />
        <StatBit value={deliverableCount} label={fields.deliverables} />
        <StatBit value={openRequestCount} label={fields.openRequests} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {fields.startDate}: {startDateLabel}
        </span>
        <span>
          {fields.dueDate}: {dueDateLabel}
        </span>
      </div>
    </Link>
  );
}

function StatBit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-[0.7rem] text-muted-foreground">{label}</span>
    </div>
  );
}
