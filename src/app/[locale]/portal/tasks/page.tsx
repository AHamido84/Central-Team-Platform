import { getTranslations, getLocale } from "next-intl/server";
import { ListChecks } from "lucide-react";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { TasksTable } from "@/components/portal/tasks-table";

export default async function PortalTasksPage() {
  const user = await requireUser();
  const t = await getTranslations("tasks");
  const locale = await getLocale();

  const clientId = user.clientId;
  const tasks = clientId
    ? await prisma.task.findMany({
        where: { project: { clientId }, clientVisible: true },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, name: true } } },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <TasksTable tasks={tasks} locale={locale} showProject />
      )}
    </div>
  );
}
