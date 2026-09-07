import { getTranslations, getLocale } from "next-intl/server";
import { FileText, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/portal/empty-state";
import { formatDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";

export default async function ClientContractsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("contracts");
  const locale = await getLocale();

  const contracts = await prisma.contract.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          render={
            <Link href={`/contracts/new?clientId=${id}`}>
              <Plus className="size-4" />
              {t("createButton")}
            </Link>
          }
        />
      </div>
      {contracts.length === 0 ? (
        <EmptyState icon={FileText} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{contract.title}</span>
                <Badge variant="secondary">{t(`status.${contract.status}`)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {contract.value ? `${contract.value.toString()} ${contract.currency ?? ""}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(contract.endDate, locale)}</p>
              <p className="text-xs text-muted-foreground">
                {t("table.projects")}: {contract._count.projects}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
