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
    include: {
      items: {
        select: {
          id: true,
          category: true,
          quantity: true,
          status: true,
          unit: true,
          progressMode: true,
          manualProgressPercent: true,
          weight: true,
        },
      },
    },
  });

  // Real task-completion ratios for any scope item tracked TASK_BASED —
  // never estimated, only counted from this project's actual tasks.
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

  return (
    <ScopeBreakdown
      items={(scope?.items ?? []).map((item) => ({
        ...item,
        weight: item.weight ? item.weight.toNumber() : null,
      }))}
      taskStatsByItemId={taskStatsByItemId}
    />
  );
}
