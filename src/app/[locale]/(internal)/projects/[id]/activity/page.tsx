import { getTranslations, getLocale } from "next-intl/server";
import { History } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { ActivityTimeline } from "@/components/portal/activity-timeline";
import { formatDate } from "@/lib/format-date";

export default async function InternalProjectActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const t = await getTranslations("activity");
  const locale = await getLocale();

  const entries = await prisma.auditLog.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (entries.length === 0) {
    return <EmptyState icon={History} title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <ActivityTimeline
      entries={entries.map((entry) => ({
        id: entry.id,
        action: entry.action,
        createdAtLabel: formatDate(entry.createdAt, locale),
      }))}
      labelFor={(action) => t(`actions.${action}`)}
    />
  );
}
