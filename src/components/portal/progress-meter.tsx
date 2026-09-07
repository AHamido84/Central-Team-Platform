import { cn } from "@/lib/utils";

/**
 * A linear progress meter: fill carries the value, the unfilled track is a
 * lighter step of the same hue (never a neutral gray) so the state reads
 * across the whole bar. Text stays in text tokens — the color lives only on
 * the mark. See the dataviz skill's marks-and-anatomy.md "Meter" spec.
 */
export function ProgressMeter({
  percent,
  className,
  fillClassName,
}: {
  percent: number;
  className?: string;
  fillClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-primary/15", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width] duration-300", fillClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
