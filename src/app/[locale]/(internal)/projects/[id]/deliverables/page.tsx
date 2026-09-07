import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { DeliverableCard } from "@/components/portal/deliverable-card";
import { EmptyState } from "@/components/portal/empty-state";
import { AddDeliverableDialog } from "@/components/deliverables/add-deliverable-dialog";
import { PackageCheck } from "lucide-react";

export default async function InternalProjectDeliverablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("deliverables");

  const [deliverables, tasks] = await Promise.all([
    prisma.deliverable.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      include: { assets: true },
    }),
    prisma.task.findMany({ where: { projectId: id }, select: { id: true, title: true } }),
  ]);

  // Only offer "latest version, not yet superseded" rows as version targets.
  const latestVersions = deliverables.filter(
    (d) => !deliverables.some((other) => other.supersedesId === d.id),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddDeliverableDialog
          projectId={id}
          tasks={tasks.map((task) => ({ id: task.id, label: task.title }))}
          existingDeliverables={latestVersions.map((d) => ({ id: d.id, label: d.title, version: d.version }))}
        />
      </div>
      {deliverables.length === 0 ? (
        <EmptyState icon={PackageCheck} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((deliverable) => (
            <DeliverableCard key={deliverable.id} deliverable={deliverable} showProject={false} basePath="" />
          ))}
        </div>
      )}
    </div>
  );
}
