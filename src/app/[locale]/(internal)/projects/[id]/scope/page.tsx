import { prisma } from "@/lib/prisma";
import { ScopeBreakdown } from "@/components/portal/scope-breakdown";
import { AddScopeItemDialog } from "@/components/projects/add-scope-item-dialog";
import { addScopeItemAction } from "@/lib/actions/project-actions";

export default async function InternalProjectScopePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const scope = await prisma.projectScope.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
    include: { items: { select: { category: true, quantity: true, status: true, unit: true } } },
  });

  const addItemAction = scope ? addScopeItemAction.bind(null, scope.id, id) : null;

  return (
    <div className="flex flex-col gap-4">
      {addItemAction && (
        <div className="flex justify-end">
          <AddScopeItemDialog action={addItemAction} />
        </div>
      )}
      <ScopeBreakdown items={scope?.items ?? []} />
    </div>
  );
}
