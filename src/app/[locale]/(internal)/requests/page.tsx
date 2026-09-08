import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { RequestsTable } from "@/components/portal/requests-table";
import { EmptyState } from "@/components/portal/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { requestStatusValues } from "@/lib/validations/request-status-values";
import { priorityValues } from "@/lib/validations/project";
import type { RequestStatus, Priority } from "@prisma/client";

const UNASSIGNED = "__unassigned__";

export default async function InternalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    clientId?: string;
    projectId?: string;
    requestTypeId?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
  }>;
}) {
  const { status, clientId, projectId, requestTypeId, priority, assigneeId, dueDate } = await searchParams;
  const t = await getTranslations("requests");
  const tStatus = await getTranslations("requests.status");
  const tPriority = await getTranslations("projects.priority");
  const tFilters = await getTranslations("requests.filters");
  const locale = await getLocale();

  const [requests, clients, projects, requestTypes, internalUsers] = await Promise.all([
    prisma.request.findMany({
      where: {
        status: status ? (status as RequestStatus) : undefined,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        requestTypeId: requestTypeId || undefined,
        priority: priority ? (priority as Priority) : undefined,
        assignedToId: assigneeId ? (assigneeId === UNASSIGNED ? null : assigneeId) : undefined,
        dueDate: dueDate ? { lte: new Date(dueDate) } : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        requestType: true,
        project: { select: { id: true, name: true } },
        client: { select: { id: true, companyName: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.requestType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { clientId: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("internalTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("internalSubtitle")}</p>
        </div>
        <Button
          render={
            <Link href="/requests/new">
              <Plus className="size-4" />
              {t("newButton")}
            </Link>
          }
        />
      </div>

      <FilterBar
        resetLabel={tFilters("reset")}
        dateKey="dueDate"
        filters={[
          {
            key: "clientId",
            placeholder: tFilters("allClients"),
            options: clients.map((c) => ({ value: c.id, label: c.companyName })),
          },
          {
            key: "projectId",
            placeholder: tFilters("allProjects"),
            options: projects.map((p) => ({ value: p.id, label: p.name })),
          },
          {
            key: "requestTypeId",
            placeholder: tFilters("allTypes"),
            options: requestTypes.map((rt) => ({ value: rt.id, label: rt.name })),
          },
          {
            key: "status",
            placeholder: tFilters("allStatuses"),
            options: requestStatusValues.map((value) => ({ value, label: tStatus(value) })),
          },
          {
            key: "priority",
            placeholder: tFilters("allPriorities"),
            options: priorityValues.map((value) => ({ value, label: tPriority(value) })),
          },
          {
            key: "assigneeId",
            placeholder: tFilters("allAssignees"),
            options: [
              { value: UNASSIGNED, label: tFilters("unassigned") },
              ...internalUsers.map((u) => ({ value: u.id, label: u.name })),
            ],
          },
        ]}
      />

      {requests.length === 0 ? (
        <EmptyState icon={Inbox} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <RequestsTable
          requests={requests}
          locale={locale}
          basePath=""
          showProject
          showClient
          showPriorityAssignee
        />
      )}
    </div>
  );
}
