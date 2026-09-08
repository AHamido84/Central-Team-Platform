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
import { ProgressMeter } from "@/components/portal/progress-meter";
import { formatDate } from "@/lib/format-date";
import { taskProgressPercent } from "@/lib/task-progress";
import type { TaskStatus } from "@prisma/client";

type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: Date | null;
  project?: { id: string; name: string } | null;
  assignee?: { name: string } | null;
};

export async function TasksTable({
  tasks,
  locale,
  basePath = "/portal",
  showProject,
  showAssignee = false,
}: {
  tasks: TaskRow[];
  locale: string;
  /** "" for internal, "/portal" for the client portal. */
  basePath?: string;
  showProject: boolean;
  showAssignee?: boolean;
}) {
  const t = await getTranslations("tasks");

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.task")}</TableHead>
            {showProject && <TableHead>{t("fields.project")}</TableHead>}
            {showAssignee && <TableHead>{t("fields.assignee")}</TableHead>}
            <TableHead>{t("fields.status")}</TableHead>
            <TableHead className="w-40">{t("fields.progress")}</TableHead>
            <TableHead>{t("fields.dueDate")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const percent = taskProgressPercent(task.status);
            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium">
                  {basePath === "" ? (
                    <Link href={`/tasks/${task.id}`} className="hover:underline">
                      {task.title}
                    </Link>
                  ) : (
                    task.title
                  )}
                </TableCell>
                {showProject && (
                  <TableCell className="text-muted-foreground">
                    {task.project && (
                      <Link href={`${basePath}/projects/${task.project.id}`} className="hover:underline">
                        {task.project.name}
                      </Link>
                    )}
                  </TableCell>
                )}
                {showAssignee && (
                  <TableCell className="text-muted-foreground">
                    {task.assignee?.name ?? "—"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="secondary">{t(`status.${task.status}`)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ProgressMeter percent={percent} className="h-1.5" />
                    <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {percent}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(task.dueDate, locale)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
