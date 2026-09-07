import type { LucideIcon } from "lucide-react";
import { NavItem } from "./nav-item";

export function Sidebar({
  appName,
  navItems,
}: {
  appName: string;
  navItems: { href: string; label: string; icon: LucideIcon }[];
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center px-5">
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          {appName}
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  );
}
