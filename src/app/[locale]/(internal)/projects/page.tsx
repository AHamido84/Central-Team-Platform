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
import { Plus, FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  await requireUser();
  const t = await getTranslations("projects");
  const tStatus = await getTranslations("projects.status");
  const tPriority = await getTranslations("projects.priority");

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { companyName: true } }, projectType: true },
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
            <Link href="/projects/new">
              <Plus className="size-4" />
              {t("createButton")}
            </Link>
          }
        />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <FolderKanban className="size-8 text-muted-foreground" />
          <h2 className="text-lg font-medium">{t("empty.title")}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.client")}</TableHead>
                <TableHead>{t("fields.projectType")}</TableHead>
                <TableHead>{t("fields.priority")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link href={`/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.client.companyName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.projectType.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tPriority(project.priority)}
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
