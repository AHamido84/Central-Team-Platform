"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { NavItemDef } from "./nav-item";
import { NavList } from "./nav-list";
import { SidebarGroup, type NavGroupDef } from "./sidebar-group";

export function MobileNav({
  appName,
  navItems,
  navGroups,
  menuLabel,
}: {
  appName: string;
  navItems?: NavItemDef[];
  navGroups?: NavGroupDef[];
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  // Slide in from the same side the desktop sidebar sits on: end-of-line,
  // which is the right in RTL and the left in LTR.
  const side = locale === "ar" ? "right" : "left";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className="flex w-3/4 max-w-xs flex-col bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-5 py-0">
          <SheetTitle className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            {appName}
          </SheetTitle>
        </SheetHeader>
        {navGroups ? (
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
            {navGroups.map((group) => (
              <SidebarGroup
                key={group.label}
                label={group.label}
                items={group.items}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        ) : (
          navItems && <NavList navItems={navItems} onNavigate={() => setOpen(false)} />
        )}
      </SheetContent>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={menuLabel}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
    </Sheet>
  );
}
