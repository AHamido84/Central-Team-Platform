import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
import { FolderKanban } from "lucide-react";

export default async function PortalProjectsPage() {
  const user = await requireUser();
  const t = await getTranslations("projects");
  const tStatus = await getTranslations("projects.status");

  // Client-portal users only ever see their own client's projects — the
  // clientId comes from the session (user.clientId), never from the
  // request. See ARCHITECTURE.md §5.
  const projects = user.clientId
    ? await prisma.project.findMany({
        where: { clientId: user.clientId },
        orderBy: { createdAt: "desc" },
        include: { projectType: true },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <FolderKanban className="size-8 text-muted-foreground" />
          <h2 className="text-lg font-medium">{t("empty.title")}</h2>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.projectType")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link href={`/portal/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.projectType.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tStatus(project.status)}</Badge>
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
