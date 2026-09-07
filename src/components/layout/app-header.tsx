import type { NavItemDef } from "./nav-item";
import type { NavGroupDef } from "./sidebar-group";
import { LanguageSwitcher } from "./language-switcher";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export function AppHeader({
  appName,
  navItems,
  navGroups,
  menuLabel,
  breadcrumb,
  headerActions,
  user,
}: {
  appName: string;
  navItems?: NavItemDef[];
  navGroups?: NavGroupDef[];
  menuLabel: string;
  breadcrumb?: React.ReactNode;
  /** Extra controls (global search, notification bell, quick-create) shown
   * only in shells that opt in — the portal header stays as it was. */
  headerActions?: React.ReactNode;
  user: { name: string; email: string };
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav appName={appName} navItems={navItems} navGroups={navGroups} menuLabel={menuLabel} />
        {breadcrumb}
      </div>
      <div className="flex items-center gap-2">
        {headerActions}
        <LanguageSwitcher />
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
