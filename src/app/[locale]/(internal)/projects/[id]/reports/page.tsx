import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/portal/empty-state";
import { FileBarChart } from "lucide-react";

export default async function InternalProjectReportsPage() {
  const t = await getTranslations("projects.reports.empty");
  return <EmptyState icon={FileBarChart} title={t("title")} description={t("description")} />;
}
