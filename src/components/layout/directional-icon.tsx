import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps a directional icon (chevron, arrow, breadcrumb separator) so it
 * mirrors correctly under RTL. This is the single place that knows about
 * icon flipping — components should never add their own `rtl:` transform
 * classes. See ARCHITECTURE.md §3.
 */
export function DirectionalIcon({
  icon: Icon,
  className,
  ...props
}: {
  icon: LucideIcon;
  className?: string;
} & React.ComponentProps<LucideIcon>) {
  return <Icon className={cn("rtl:-scale-x-100", className)} {...props} />;
}
