import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/authorization";
import { getProjectForClientOrNotFound } from "@/lib/portal-project";
import { EmptyState } from "@/components/portal/empty-state";
import { FileBarChart } from "lucide-react";

export default async function ProjectReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await getProjectForClientOrNotFound(id, user);
  const t = await getTranslations("projects.reports.empty");

  return <EmptyState icon={FileBarChart} title={t("title")} description={t("description")} />;
}
