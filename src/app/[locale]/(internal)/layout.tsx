import { getTranslations, getLocale } from "next-intl/server";
import { LayoutDashboard, Building2, FolderKanban } from "lucide-react";
import { requireUser, isInternalUser } from "@/lib/authorization";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { redirect } from "@/i18n/navigation";

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

  const navItems = [
    { href: "/", label: t("nav.internal.dashboard"), icon: LayoutDashboard },
    { href: "/clients", label: t("nav.internal.clients"), icon: Building2 },
    { href: "/projects", label: t("nav.internal.projects"), icon: FolderKanban },
  ];

  return (
    <AppShell appName={t("common.appName")} navItems={navItems} user={user}>
      {children}
    </AppShell>
  );
}
