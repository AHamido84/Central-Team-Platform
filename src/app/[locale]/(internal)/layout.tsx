import { getTranslations, getLocale } from "next-intl/server";
import { requireUser, isInternalUser } from "@/lib/authorization";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationBell } from "@/components/layout/notification-bell";
import { GlobalSearchDialog } from "@/components/layout/global-search-dialog";
import { QuickCreateMenu } from "@/components/layout/quick-create-menu";
import { prisma } from "@/lib/prisma";
import { redirect } from "@/i18n/navigation";
import type { NavGroupDef } from "@/components/layout/sidebar-group";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireUser();
  if (!isInternalUser(sessionUser)) {
    const locale = await getLocale();
    redirect({ href: "/portal", locale });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, email: true },
  });

  const t = await getTranslations();

  const navGroups: NavGroupDef[] = [
    {
      label: t("nav.groups.overview"),
      items: [
        { href: "/", label: t("nav.internal.dashboard"), icon: "LayoutDashboard", exact: true },
        { href: "/notifications", label: t("nav.internal.notifications"), icon: "Bell" },
      ],
    },
    {
      label: t("nav.groups.clientsProjects"),
      items: [
        { href: "/clients", label: t("nav.internal.clients"), icon: "Building2" },
        { href: "/contracts", label: t("nav.internal.contracts"), icon: "FileText" },
        { href: "/projects", label: t("nav.internal.projects"), icon: "FolderKanban" },
      ],
    },
    {
      label: t("nav.groups.work"),
      items: [
        { href: "/requests", label: t("nav.internal.requests"), icon: "Inbox" },
        { href: "/tasks", label: t("nav.internal.tasks"), icon: "ListChecks" },
        { href: "/deliverables", label: t("nav.internal.deliverables"), icon: "PackageCheck" },
      ],
    },
    {
      label: t("nav.groups.marketingSales"),
      items: [
        { href: "/campaigns", label: t("nav.internal.campaigns"), icon: "Megaphone" },
        { href: "/leads", label: t("nav.internal.leads"), icon: "UserPlus" },
        { href: "/sales", label: t("nav.internal.sales"), icon: "TrendingUp" },
      ],
    },
    {
      label: t("nav.groups.admin"),
      items: [
        { href: "/team", label: t("nav.internal.team"), icon: "Users" },
        { href: "/integrations", label: t("nav.internal.integrations"), icon: "Plug" },
        { href: "/settings", label: t("nav.internal.settings"), icon: "Settings" },
      ],
    },
  ];

  return (
    <AppShell
      appName={t("common.appName")}
      navGroups={navGroups}
      collapsible
      collapseLabel={t("nav.sidebar.toggle")}
      menuLabel={t("nav.openMenu")}
      headerActions={
        <>
          <GlobalSearchDialog />
          <NotificationBell notificationsHref="/notifications" />
          <QuickCreateMenu />
        </>
      }
      user={user}
    >
      {children}
    </AppShell>
  );
}
