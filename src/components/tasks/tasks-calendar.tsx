import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import type { TaskStatus } from "@prisma/client";

type CalendarTask = {
  id: string;
  title: string;
  dueDate: Date | null;
  status: TaskStatus;
};

/** A lightweight calendar view: tasks grouped by due date, ordered
 * chronologically, with an explicit "no due date" bucket last. No calendar
 * grid/DnD library — the spec only asks for a calendar view "where
 * supported," and a due-date-grouped list gives the same at-a-glance
 * schedule without the added dependency. */
export async function TasksCalendar({ tasks, locale }: { tasks: CalendarTask[]; locale: string }) {
  const t = await getTranslations("tasks");

  const groups = new Map<string, CalendarTask[]>();
  for (const task of tasks) {
    const key = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "none";
    const list = groups.get(key) ?? [];
    list.push(task);
    groups.set(key, list);
  }
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "none") return 1;
    if (b === "none") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-4">
      {sortedKeys.map((key) => {
        const groupTasks = groups.get(key)!;
        const dateLabel = key === "none" ? t("fields.dueDate") + " —" : formatDate(groupTasks[0].dueDate, locale);
        return (
          <div key={key} className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{dateLabel}</h3>
            <ul className="flex flex-col divide-y divide-border">
              {groupTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <Link href={`/tasks/${task.id}`} className="hover:underline">
                    {task.title}
                  </Link>
                  <Badge variant="secondary">{t(`status.${task.status}`)}</Badge>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
