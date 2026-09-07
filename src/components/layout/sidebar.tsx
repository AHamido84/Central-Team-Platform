import type { NavItemDef } from "./nav-item";
import { NavList } from "./nav-list";

export function Sidebar({
  appName,
  navItems,
}: {
  appName: string;
  navItems: NavItemDef[];
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center px-5">
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          {appName}
        </span>
      </div>
      <NavList navItems={navItems} />
    </aside>
  );
}
