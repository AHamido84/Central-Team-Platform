import type { LucideIcon } from "lucide-react";
import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";

export function AppShell({
  appName,
  navItems,
  breadcrumb,
  user,
  children,
}: {
  appName: string;
  navItems: { href: string; label: string; icon: LucideIcon }[];
  breadcrumb?: React.ReactNode;
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar appName={appName} navItems={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader breadcrumb={breadcrumb} user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
