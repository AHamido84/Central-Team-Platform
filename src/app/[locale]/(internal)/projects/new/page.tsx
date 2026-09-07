import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { createProjectAction } from "@/lib/actions/project-actions";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await requireUser();
  const { clientId } = await searchParams;
  const t = await getTranslations("projects");
  const tCommon = await getTranslations("common");

  const [clients, projectTypes, internalUsers, contracts] = await Promise.all([
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("createTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={createProjectAction}
            submitLabel={tCommon("actions.create")}
            clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
            projectTypes={projectTypes.map((pt) => ({ id: pt.id, label: pt.name }))}
            internalUsers={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
            contracts={contracts.map((c) => ({ id: c.id, label: `${c.title} — ${c.client.companyName}` }))}
            defaultValues={clientId ? { clientId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
