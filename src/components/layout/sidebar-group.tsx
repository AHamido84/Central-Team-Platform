"use client";

import { NavItem, type NavItemDef } from "./nav-item";
import { useSidebarCollapse } from "./sidebar-collapse-provider";

export function SidebarGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: NavItemDef[];
  onNavigate?: () => void;
}) {
  const { collapsed } = useSidebarCollapse();

  return (
    <div className="flex flex-col gap-1">
      {!collapsed && (
        <p className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-sidebar-foreground/50">
          {label}
        </p>
      )}
      {items.map((item) => (
        <NavItem key={item.href} {...item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export type NavGroupDef = { label: string; items: NavItemDef[] };
