import { getTranslations, getLocale } from "next-intl/server";
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
} from "lucide-react";
import { requireUser, isClientUser } from "@/lib/authorization";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { redirect } from "@/i18n/navigation";
import type { NavItemDef } from "@/components/layout/nav-item";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireUser();
  if (!isClientUser(sessionUser)) {
    const locale = await getLocale();
    redirect({ href: "/", locale });
  }

  const clientId = sessionUser.clientId;
  const [user, campaignCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { name: true, email: true },
    }),
    clientId ? prisma.campaign.count({ where: { project: { clientId } } }) : 0,
  ]);

  const t = await getTranslations();

  const navItems: NavItemDef[] = [
    { href: "/portal", label: t("nav.portal.dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/portal/projects", label: t("nav.portal.projects"), icon: FolderKanban },
    { href: "/portal/requests", label: t("nav.portal.requests"), icon: Inbox },
    { href: "/portal/tasks", label: t("nav.portal.tasks"), icon: ListChecks },
    { href: "/portal/deliverables", label: t("nav.portal.deliverables"), icon: PackageCheck },
    // Only shown when the client actually has advertising campaigns running —
    // no point dominating the interface with a section that's always empty.
    ...(campaignCount > 0
      ? [{ href: "/portal/campaigns", label: t("nav.portal.campaigns"), icon: Megaphone }]
      : []),
    { href: "/portal/files", label: t("nav.portal.files"), icon: FolderOpen },
    { href: "/portal/notifications", label: t("nav.portal.notifications"), icon: Bell },
    { href: "/portal/account", label: t("nav.portal.account"), icon: UserCircle },
  ];

  return (
    <AppShell
      appName={t("common.appName")}
      navItems={navItems}
      menuLabel={t("nav.openMenu")}
      user={user}
    >
      {children}
    </AppShell>
  );
}
