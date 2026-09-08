import { prisma } from "@/lib/prisma";
import { ScopeBreakdown } from "@/components/portal/scope-breakdown";
import { AddScopeItemDialog } from "@/components/projects/add-scope-item-dialog";
import { ScopeItemsManageList } from "@/components/projects/scope-items-manage-list";
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
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          category: true,
          name: true,
          description: true,
          quantity: true,
          unit: true,
          status: true,
          progressMode: true,
          manualProgressPercent: true,
          weight: true,
          estimatedHours: true,
          dueDate: true,
        },
      },
    },
  });

  const tasks = await prisma.task.findMany({
    where: { projectId: id, scopeItemId: { not: null } },
    select: { scopeItemId: true, status: true },
  });
  const taskStatsByItemId = new Map<string, { total: number; done: number }>();
  for (const task of tasks) {
    if (!task.scopeItemId) continue;
    const stats = taskStatsByItemId.get(task.scopeItemId) ?? { total: 0, done: 0 };
    stats.total += 1;
    if (task.status === "COMPLETED") stats.done += 1;
    taskStatsByItemId.set(task.scopeItemId, stats);
  }

  const addItemAction = scope ? addScopeItemAction.bind(null, scope.id, id) : null;

  return (
    <div className="flex flex-col gap-6">
      {addItemAction && (
        <div className="flex justify-end">
          <AddScopeItemDialog action={addItemAction} />
        </div>
      )}
      <ScopeBreakdown
        items={(scope?.items ?? []).map((item) => ({
          ...item,
          weight: item.weight ? item.weight.toNumber() : null,
        }))}
        taskStatsByItemId={taskStatsByItemId}
      />
      {scope && scope.items.length > 0 && (
        <ScopeItemsManageList
          projectId={id}
          items={scope.items.map((item) => ({
            ...item,
            manualProgressPercent: item.manualProgressPercent ?? null,
            weight: item.weight ? item.weight.toNumber() : null,
            estimatedHours: item.estimatedHours ? item.estimatedHours.toNumber() : null,
          }))}
        />
      )}
    </div>
  );
}
