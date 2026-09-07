import { getTranslations, getLocale } from "next-intl/server";
import { Inbox, Plus } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { RequestsTable } from "@/components/portal/requests-table";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function PortalRequestsPage() {
  const user = await requireUser();
  const t = await getTranslations("requests");
  const locale = await getLocale();

  const clientId = user.clientId;
  const requests = clientId
    ? await prisma.request.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        include: { requestType: true, project: { select: { id: true, name: true } } },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          render={
            <Link href="/portal/requests/new">
              <Plus className="size-4" />
              {t("newButton")}
            </Link>
          }
        />
      </div>
      {requests.length === 0 ? (
        <EmptyState icon={Inbox} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <RequestsTable requests={requests} locale={locale} showProject />
      )}
    </div>
  );
}
