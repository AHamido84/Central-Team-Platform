import { getTranslations } from "next-intl/server";
import { PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeliverableCard } from "@/components/portal/deliverable-card";
import { EmptyState } from "@/components/portal/empty-state";

export default async function ClientDeliverablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("deliverables");

  const deliverables = await prisma.deliverable.findMany({
    where: { project: { clientId: id } },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true } }, assets: true },
  });

  if (deliverables.length === 0) {
    return <EmptyState icon={PackageCheck} title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deliverables.map((deliverable) => (
        <DeliverableCard key={deliverable.id} deliverable={deliverable} showProject basePath="" />
      ))}
    </div>
  );
}
