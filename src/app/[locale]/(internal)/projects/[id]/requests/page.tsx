import { getTranslations, getLocale } from "next-intl/server";
import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RequestsTable } from "@/components/portal/requests-table";
import { EmptyState } from "@/components/portal/empty-state";

export default async function InternalProjectRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const requests = await prisma.request.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { requestType: true, assignedTo: { select: { name: true } } },
  });

  if (requests.length === 0) {
    return <EmptyState icon={Inbox} title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <RequestsTable requests={requests} locale={locale} basePath="" showProject={false} showPriorityAssignee />
  );
}
