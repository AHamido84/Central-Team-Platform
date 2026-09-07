import { getTranslations } from "next-intl/server";
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
import { Plus, Building2 } from "lucide-react";

export default async function ClientsPage() {
  await requireUser();
  const t = await getTranslations("clients");
  const tStatus = await getTranslations("clients.status");

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { accountManager: { select: { name: true } } },
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
            <Link href="/clients/new">
              <Plus className="size-4" />
              {t("createButton")}
            </Link>
          }
        />
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <Building2 className="size-8 text-muted-foreground" />
          <h2 className="text-lg font-medium">{t("empty.title")}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.companyName")}</TableHead>
                <TableHead>{t("fields.industry")}</TableHead>
                <TableHead>{t("fields.accountManager")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.industry ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.accountManager?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tStatus(client.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
