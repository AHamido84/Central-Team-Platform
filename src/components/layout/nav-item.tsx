"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type NavItemDef = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only highlight on an exact path match — for root/dashboard links whose
   * href is a prefix of every other item under it (e.g. "/portal"). */
  exact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
