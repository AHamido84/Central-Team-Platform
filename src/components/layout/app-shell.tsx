import type { NavItemDef } from "./nav-item";
import type { NavGroupDef } from "./sidebar-group";
import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";
import { SidebarCollapseProvider } from "./sidebar-collapse-provider";

export function AppShell({
  appName,
  navItems,
  navGroups,
  collapsible = false,
  collapseLabel,
  menuLabel,
  breadcrumb,
  headerActions,
  user,
  children,
}: {
  appName: string;
  navItems?: NavItemDef[];
  navGroups?: NavGroupDef[];
  collapsible?: boolean;
  collapseLabel?: string;
  menuLabel: string;
  breadcrumb?: React.ReactNode;
  headerActions?: React.ReactNode;
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  return (
    <SidebarCollapseProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar
          appName={appName}
          navItems={navItems}
          navGroups={navGroups}
          collapsible={collapsible}
          collapseLabel={collapseLabel}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            appName={appName}
            navItems={navItems}
            navGroups={navGroups}
            menuLabel={menuLabel}
            breadcrumb={breadcrumb}
            headerActions={headerActions}
            user={user}
          />
          <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarCollapseProvider>
  );
}
