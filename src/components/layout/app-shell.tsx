import type { NavItemDef } from "./nav-item";
import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";

export function AppShell({
  appName,
  navItems,
  menuLabel,
  breadcrumb,
  user,
  children,
}: {
  appName: string;
  navItems: NavItemDef[];
  menuLabel: string;
  breadcrumb?: React.ReactNode;
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar appName={appName} navItems={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          appName={appName}
          navItems={navItems}
          menuLabel={menuLabel}
          breadcrumb={breadcrumb}
          user={user}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
