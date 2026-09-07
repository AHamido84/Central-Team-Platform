"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_ICONS, type NavIconName } from "./nav-icons";

export type NavItemDef = {
  href: string;
  label: string;
  icon: NavIconName;
  exact?: boolean;
};

export function NavItem({
  href,
  label,
  icon,
  exact = false,
  collapsed = false,
  onNavigate,
}: NavItemDef & {
  /** Icon-only rendering for the collapsed internal sidebar — label moves
   * into a Tooltip instead of disappearing entirely. */
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = NAV_ICONS[icon];

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="inline-end">{label}</TooltipContent>
    </Tooltip>
  );
}
