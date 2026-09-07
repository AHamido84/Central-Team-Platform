import { getTranslations, getLocale } from "next-intl/server";
import { LayoutDashboard, FolderKanban } from "lucide-react";
import { requireUser, isClientUser } from "@/lib/authorization";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { redirect } from "@/i18n/navigation";

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

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, email: true },
  });

  const t = await getTranslations();

  const navItems = [
    { href: "/portal", label: t("nav.portal.dashboard"), icon: LayoutDashboard },
    { href: "/portal/projects", label: t("nav.portal.myProjects"), icon: FolderKanban },
  ];

  return (
    <AppShell appName={t("common.appName")} navItems={navItems} user={user}>
      {children}
    </AppShell>
  );
}
