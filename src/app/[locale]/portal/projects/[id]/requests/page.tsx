import { getTranslations, getLocale } from "next-intl/server";
import { Inbox, Plus } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { RequestsTable } from "@/components/portal/requests-table";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function ProjectRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const requests = await prisma.request.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { requestType: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          render={
            <Link href={`/portal/requests/new?projectId=${id}`}>
              <Plus className="size-4" />
              {t("newButton")}
            </Link>
          }
        />
      </div>
      {requests.length === 0 ? (
        <EmptyState icon={Inbox} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <RequestsTable requests={requests} locale={locale} showProject={false} />
      )}
    </div>
  );
}
