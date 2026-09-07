import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { RequestsTable } from "@/components/portal/requests-table";
import { EmptyState } from "@/components/portal/empty-state";
import type { RequestStatus } from "@prisma/client";

export default async function InternalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clientId?: string }>;
}) {
  const { status, clientId } = await searchParams;
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const requests = await prisma.request.findMany({
    where: {
      status: status ? (status as RequestStatus) : undefined,
      clientId: clientId || undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      requestType: true,
      project: { select: { id: true, name: true } },
      client: { select: { id: true, companyName: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("internalTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("internalSubtitle")}</p>
        </div>
        <Button
          render={
            <Link href="/requests/new">
              <Plus className="size-4" />
              {t("newButton")}
            </Link>
          }
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={Inbox} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <RequestsTable
          requests={requests}
          locale={locale}
          basePath=""
          showProject
          showClient
          showPriorityAssignee
        />
      )}
    </div>
  );
}
