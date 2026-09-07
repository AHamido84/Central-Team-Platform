import { NavItem, type NavItemDef } from "./nav-item";

export function NavList({
  navItems,
  onNavigate,
}: {
  navItems: NavItemDef[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      {navItems.map((item) => (
        <NavItem key={item.href} {...item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
