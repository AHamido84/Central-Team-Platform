import { getTranslations, getLocale } from "next-intl/server";
import { Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RequestsTable } from "@/components/portal/requests-table";
import { EmptyState } from "@/components/portal/empty-state";

export default async function ClientRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const requests = await prisma.request.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    include: { requestType: true, project: { select: { id: true, name: true } }, assignedTo: { select: { name: true } } },
  });

  if (requests.length === 0) {
    return <EmptyState icon={Inbox} title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <RequestsTable
      requests={requests}
      locale={locale}
      basePath=""
      showProject
      showPriorityAssignee
    />
  );
}
