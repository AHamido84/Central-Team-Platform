import { getTranslations, getLocale } from "next-intl/server";
import { FolderOpen } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { FilesTable } from "@/components/portal/files-table";

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations("files");
  const locale = await getLocale();

  const assets = await prisma.asset.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { deliverable: { select: { title: true } } },
  });

  return assets.length === 0 ? (
    <EmptyState icon={FolderOpen} title={t("empty.title")} description={t("empty.description")} />
  ) : (
    <FilesTable assets={assets} locale={locale} showProject={false} />
  );
}
