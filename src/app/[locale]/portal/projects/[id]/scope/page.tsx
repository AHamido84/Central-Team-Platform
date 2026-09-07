import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { prisma } from "@/lib/prisma";
import { ScopeBreakdown } from "@/components/portal/scope-breakdown";

export default async function ProjectScopePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);

  const scope = await prisma.projectScope.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
    include: { items: { select: { category: true, quantity: true, status: true, unit: true } } },
  });

  return <ScopeBreakdown items={scope?.items ?? []} />;
}
