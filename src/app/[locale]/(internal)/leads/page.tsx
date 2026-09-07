import { getTranslations, getLocale } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { formatDate } from "@/lib/format-date";

export default async function LeadsPage() {
  const t = await getTranslations("leads");
  const locale = await getLocale();

  const [leads, clients, internalUsers] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, companyName: true } }, assignedTo: { select: { name: true } } },
    }),
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddLeadDialog
          clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
          assignees={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
        />
      </div>

      {leads.length === 0 ? (
        <EmptyState icon={UserPlus} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.client")}</TableHead>
                <TableHead>{t("fields.source")}</TableHead>
                <TableHead>{t("fields.assignee")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead>{t("fields.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {lead.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <Link href={`/clients/${lead.client.id}`} className="hover:underline">
                      {lead.client.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.source ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.assignedTo?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t(`status.${lead.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.createdAt, locale)}
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
