import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProjectAction } from "@/lib/actions/project-actions";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

function toDateInputValue(date: Date | null) {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const t = await getTranslations("projects");
  const tCommon = await getTranslations("common");

  const [project, clients, projectTypes, internalUsers, contracts] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.projectType.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { clientId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.contract.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, client: { select: { companyName: true } } },
    }),
  ]);

  if (!project) notFound();

  const updateAction = updateProjectAction.bind(null, project.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("editTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={updateAction}
            submitLabel={tCommon("actions.saveChanges")}
            clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
            projectTypes={projectTypes.map((pt) => ({ id: pt.id, label: pt.name }))}
            internalUsers={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
            contracts={contracts.map((c) => ({ id: c.id, label: `${c.title} — ${c.client.companyName}` }))}
            defaultValues={{
              clientId: project.clientId,
              contractId: project.contractId ?? undefined,
              projectTypeId: project.projectTypeId,
              name: project.name,
              projectCode: project.projectCode ?? undefined,
              description: project.description ?? undefined,
              status: project.status,
              priority: project.priority,
              startDate: toDateInputValue(project.startDate),
              dueDate: toDateInputValue(project.dueDate),
              budget: project.budget ? project.budget.toString() : undefined,
              currency: project.currency ?? undefined,
              ownerId: project.ownerId ?? undefined,
              accountManagerId: project.accountManagerId ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
