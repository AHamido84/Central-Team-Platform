import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AddScopeItemDialog } from "@/components/projects/add-scope-item-dialog";
import { addScopeItemAction } from "@/lib/actions/project-actions";
import { Pencil } from "lucide-react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const t = await getTranslations("projects");
  const tCommon = await getTranslations("common");
  const tStatus = await getTranslations("projects.status");
  const tPriority = await getTranslations("projects.priority");
  const tScope = await getTranslations("projects.scope");
  const tScopeStatus = await getTranslations("projects.scope.status");
  const tCategory = await getTranslations("projects.scope.category");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      projectType: true,
      owner: { select: { name: true } },
      accountManager: { select: { name: true } },
      scopes: {
        orderBy: { version: "desc" },
        take: 1,
        include: { items: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!project) notFound();

  const activeScope = project.scopes[0];
  const addItemAction = activeScope
    ? addScopeItemAction.bind(null, activeScope.id, project.id)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: t("title"), href: "/projects" },
          { label: project.name },
        ]}
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <Link href={`/clients/${project.clientId}`} className="text-sm text-muted-foreground hover:underline">
            {project.client.companyName}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{tStatus(project.status)}</Badge>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil className="size-4" />
                {tCommon("actions.edit")}
              </Link>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{tScope("title")}</CardTitle>
            {addItemAction && <AddScopeItemDialog action={addItemAction} />}
          </CardHeader>
          <CardContent>
            {!activeScope || activeScope.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tScope("empty")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tScope("fields.name")}</TableHead>
                    <TableHead>{tScope("fields.category")}</TableHead>
                    <TableHead>{tScope("fields.quantity")}</TableHead>
                    <TableHead>{tScope("fields.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeScope.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tCategory(item.category)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.quantity ?? "—"} {item.unit ?? ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tScopeStatus(item.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fields.projectType")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <InfoRow label={t("fields.projectType")} value={project.projectType.name} />
            <InfoRow label={t("fields.priority")} value={tPriority(project.priority)} />
            <InfoRow label={t("fields.owner")} value={project.owner?.name} />
            <InfoRow label={t("fields.accountManager")} value={project.accountManager?.name} />
            <InfoRow
              label={t("fields.startDate")}
              value={project.startDate?.toLocaleDateString()}
            />
            <InfoRow label={t("fields.dueDate")} value={project.dueDate?.toLocaleDateString()} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value ?? "—"}</span>
    </div>
  );
}
