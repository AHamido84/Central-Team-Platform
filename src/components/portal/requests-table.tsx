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
  dueDate: Date | null;
  updatedAt: Date;
  requestType: { name: string };
  project?: { id: string; name: string } | null;
};

export async function RequestsTable({
  requests,
  locale,
  showProject,
}: {
  requests: RequestRow[];
  locale: string;
  showProject: boolean;
}) {
  const t = await getTranslations("requests");

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.requestNumber")}</TableHead>
            <TableHead>{t("fields.title")}</TableHead>
            <TableHead>{t("fields.requestType")}</TableHead>
            {showProject && <TableHead>{t("fields.project")}</TableHead>}
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
                <Link href={`/portal/requests/${request.id}`} className="hover:underline">
                  {request.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{request.requestType.name}</TableCell>
              {showProject && (
                <TableCell className="text-muted-foreground">
                  {request.project ? (
                    <Link href={`/portal/projects/${request.project.id}`} className="hover:underline">
                      {request.project.name}
                    </Link>
                  ) : (
                    t("noProject")
                  )}
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
