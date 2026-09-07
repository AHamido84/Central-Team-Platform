import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";

type RequestRow = {
  id: string;
  requestNumber: number;
  title: string;
  status: string;
  priority?: string;
  dueDate: Date | null;
  updatedAt: Date;
  requestType: { name: string };
  project?: { id: string; name: string } | null;
  client?: { id: string; companyName: string } | null;
  assignedTo?: { name: string } | null;
};

export async function RequestsTable({
  requests,
  locale,
  basePath = "/portal",
  showProject = true,
  showClient = false,
  showPriorityAssignee = false,
}: {
  requests: RequestRow[];
  locale: string;
  /** "" for internal, "/portal" for the client portal. */
  basePath?: string;
  showProject?: boolean;
  showClient?: boolean;
  showPriorityAssignee?: boolean;
}) {
  const t = await getTranslations("requests");
  const tPriority = await getTranslations("projects.priority");

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.requestNumber")}</TableHead>
            <TableHead>{t("fields.title")}</TableHead>
            {showClient && <TableHead>{t("fields.client")}</TableHead>}
            {showProject && <TableHead>{t("fields.project")}</TableHead>}
            <TableHead>{t("fields.requestType")}</TableHead>
            {showPriorityAssignee && <TableHead>{t("fields.priority")}</TableHead>}
            {showPriorityAssignee && <TableHead>{t("fields.assignee")}</TableHead>}
            <TableHead>{t("fields.status")}</TableHead>
            <TableHead>{t("fields.dueDate")}</TableHead>
            <TableHead>{t("fields.updatedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                #{request.requestNumber}
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`${basePath}/requests/${request.id}`} className="hover:underline">
                  {request.title}
                </Link>
              </TableCell>
              {showClient && (
                <TableCell className="text-muted-foreground">
                  {request.client ? (
                    <Link href={`/clients/${request.client.id}`} className="hover:underline">
                      {request.client.companyName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              {showProject && (
                <TableCell className="text-muted-foreground">
                  {request.project ? (
                    <Link href={`${basePath}/projects/${request.project.id}`} className="hover:underline">
                      {request.project.name}
                    </Link>
                  ) : (
                    t("noProject")
                  )}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{request.requestType.name}</TableCell>
              {showPriorityAssignee && (
                <TableCell className="text-muted-foreground">
                  {request.priority ? tPriority(request.priority) : "—"}
                </TableCell>
              )}
              {showPriorityAssignee && (
                <TableCell className="text-muted-foreground">
                  {request.assignedTo?.name ?? "—"}
                </TableCell>
              )}
              <TableCell>
                <Badge variant="secondary">{t(`status.${request.status}`)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.dueDate, locale)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.updatedAt, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
