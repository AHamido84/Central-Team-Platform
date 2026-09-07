import { getTranslations, getLocale } from "next-intl/server";
import { FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FilesTable } from "@/components/portal/files-table";
import { EmptyState } from "@/components/portal/empty-state";

export default async function InternalProjectFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("files");
  const locale = await getLocale();

  const assets = await prisma.asset.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { deliverable: { select: { title: true } } },
  });

  if (assets.length === 0) {
    return <EmptyState icon={FolderOpen} title={t("empty.title")} description={t("empty.description")} />;
  }

  return <FilesTable assets={assets} locale={locale} basePath="" showProject={false} />;
}
