"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { NavItemDef } from "./nav-item";
import { NavList } from "./nav-list";
import type { NavGroupDef } from "./sidebar-group";
import { SidebarGroup } from "./sidebar-group";
import { useSidebarCollapse } from "./sidebar-collapse-provider";
import { cn } from "@/lib/utils";

export function Sidebar({
  appName,
  navItems,
  navGroups,
  collapsible = false,
  collapseLabel,
}: {
  appName: string;
  /** Flat nav (portal): a single unlabeled list, no collapse. */
  navItems?: NavItemDef[];
  /** Grouped nav (internal): labeled sections, optionally collapsible. */
  navGroups?: NavGroupDef[];
  collapsible?: boolean;
  collapseLabel?: string;
}) {
  const { collapsed, toggle } = useSidebarCollapse();
  const isCollapsed = collapsible && collapsed;

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-150 md:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center", isCollapsed ? "justify-center px-2" : "px-5")}>
        {!isCollapsed && (
          <span className="truncate text-lg font-semibold tracking-tight text-sidebar-foreground">
            {appName}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
        {navGroups
          ? navGroups.map((group) => (
              <SidebarGroup key={group.label} label={group.label} items={group.items} />
            ))
          : navItems && <NavList navItems={navItems} />}
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={toggle}
          aria-label={collapseLabel}
          className={cn(
            "m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-2",
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="size-4 shrink-0" /> : <PanelLeftClose className="size-4 shrink-0" />}
          {!isCollapsed && collapseLabel}
        </button>
      )}
    </aside>
  );
}
