import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { TeamInviteDialog } from "@/components/team/team-invite-dialog";

const INTERNAL_ROLE_NAMES = ["SUPER_ADMIN", "ACCOUNT_MANAGER", "PROJECT_MANAGER", "STAFF"];

export default async function TeamPage() {
  const t = await getTranslations("team");

  const [members, roles] = await Promise.all([
    prisma.user.findMany({
      where: { clientId: null },
      orderBy: { name: "asc" },
      include: {
        role: { select: { name: true } },
        _count: {
          select: { assignedTasks: { where: { status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] } } } },
        },
      },
    }),
    prisma.role.findMany({ where: { name: { in: INTERNAL_ROLE_NAMES } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <TeamInviteDialog roles={roles.map((r) => ({ id: r.id, label: r.name }))} />
      </div>

      {members.length === 0 ? (
        <EmptyState icon={Users} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.email")}</TableHead>
                <TableHead>{t("fields.role")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead>{t("fields.workload")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell className="text-muted-foreground">{member.role.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t(`status.${member.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member._count.assignedTasks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
