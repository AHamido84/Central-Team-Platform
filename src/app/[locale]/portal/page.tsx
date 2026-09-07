import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { FolderKanban } from "lucide-react";

export default async function PortalDashboardPage() {
  const user = await requireUser();
  const t = await getTranslations();

  const projectCount = user.clientId
    ? await prisma.project.count({ where: { clientId: user.clientId } })
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("nav.portal.dashboard")}</h1>
      <Card className="max-w-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("nav.portal.myProjects")}
          </CardTitle>
          <FolderKanban className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{projectCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
