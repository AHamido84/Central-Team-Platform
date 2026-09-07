import type { NavItemDef } from "./nav-item";
import { LanguageSwitcher } from "./language-switcher";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export function AppHeader({
  appName,
  navItems,
  menuLabel,
  breadcrumb,
  user,
}: {
  appName: string;
  navItems: NavItemDef[];
  menuLabel: string;
  breadcrumb?: React.ReactNode;
  user: { name: string; email: string };
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav appName={appName} navItems={navItems} menuLabel={menuLabel} />
        {breadcrumb}
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
