import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
import { requireUser, assertClientScope, ForbiddenError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getTranslations("projects");
  const tStatus = await getTranslations("projects.status");
  const tScope = await getTranslations("projects.scope");
  const tScopeStatus = await getTranslations("projects.scope.status");
  const tCategory = await getTranslations("projects.scope.category");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      projectType: true,
      scopes: {
        orderBy: { version: "desc" },
        take: 1,
        include: { items: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!project) notFound();

  // The project ID came from the URL — re-derive the client it belongs to
  // and check it against the session before rendering anything. This is
  // the one check that makes the portal safe to expose by ID.
  try {
    assertClientScope(user, project.clientId);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const activeScope = project.scopes[0];

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumb
        items={[{ label: t("title"), href: "/portal/projects" }, { label: project.name }]}
      />

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <Badge variant="secondary">{tStatus(project.status)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tScope("title")}</CardTitle>
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
    </div>
  );
}
