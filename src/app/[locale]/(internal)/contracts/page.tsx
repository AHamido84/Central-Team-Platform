import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { Plus, FileText } from "lucide-react";
import { formatDate } from "@/lib/format-date";

export default async function ContractsPage() {
  await requireUser();
  const t = await getTranslations("contracts");
  const tStatus = await getTranslations("contracts.status");
  const locale = await getLocale();

  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { companyName: true } }, _count: { select: { projects: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          render={
            <Link href="/contracts/new">
              <Plus className="size-4" />
              {t("createButton")}
            </Link>
          }
        />
      </div>

      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <h2 className="text-lg font-medium">{t("empty.title")}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.client")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.value")}</TableHead>
                <TableHead>{t("table.endDate")}</TableHead>
                <TableHead>{t("table.projects")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    <Link href={`/contracts/${contract.id}`} className="hover:underline">
                      {contract.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contract.client.companyName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tStatus(contract.status)}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {contract.value ? `${contract.value.toString()} ${contract.currency ?? ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(contract.endDate, locale)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{contract._count.projects}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
