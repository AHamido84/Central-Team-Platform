import {
  LayoutDashboard,
  FolderKanban,
  Inbox,
  ListChecks,
  PackageCheck,
  Megaphone,
  FolderOpen,
  Bell,
  UserCircle,
  Building2,
  UserPlus,
  TrendingUp,
  Users,
  Plug,
  Settings,
  FileText,
} from "lucide-react";

/**
 * Nav definitions get built in Server Components (they need translations and
 * DB-derived data like campaignCount) but rendered by Client Components
 * (NavItem needs usePathname for active-state highlighting). A Lucide icon
 * is a forwardRef object — React Server Components can't serialize it across
 * that boundary as a prop value, so nav items carry an icon *name* (a plain
 * string) instead, and this registry resolves it back to a component only
 * inside the client tree.
 */
export const NAV_ICONS = {
  LayoutDashboard,
  FolderKanban,
  Inbox,
  ListChecks,
  PackageCheck,
  Megaphone,
  FolderOpen,
  Bell,
  UserCircle,
  Building2,
  UserPlus,
  TrendingUp,
  Users,
  Plug,
  Settings,
  FileText,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;
