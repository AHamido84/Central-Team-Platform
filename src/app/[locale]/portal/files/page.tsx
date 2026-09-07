import { getTranslations, getLocale } from "next-intl/server";
import { FolderOpen } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { FilesTable } from "@/components/portal/files-table";

export default async function PortalFilesPage() {
  const user = await requireUser();
  const t = await getTranslations("files");
  const locale = await getLocale();

  const clientId = user.clientId;
  const assets = clientId
    ? await prisma.asset.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        include: {
          deliverable: { select: { title: true } },
          project: { select: { id: true, name: true } },
        },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {assets.length === 0 ? (
        <EmptyState icon={FolderOpen} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <FilesTable assets={assets} locale={locale} showProject />
      )}
    </div>
  );
}
