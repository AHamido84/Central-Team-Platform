"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reassignTaskAction } from "@/lib/actions/task-actions";

const UNASSIGNED = "__unassigned__";

export function TaskAssigneeSelect({
  taskId,
  currentAssigneeId,
  assignees,
}: {
  taskId: string;
  currentAssigneeId: string | null;
  assignees: { id: string; name: string }[];
}) {
  const t = useTranslations("tasks.filters");
  const tToast = useTranslations("tasks.toast");
  const [isPending, startTransition] = useTransition();
  const items: Record<string, string> = { [UNASSIGNED]: t("unassigned") };
  for (const user of assignees) items[user.id] = user.name;

  return (
    <Select
      value={currentAssigneeId ?? UNASSIGNED}
      disabled={isPending}
      items={items}
      onValueChange={(value) => {
        startTransition(async () => {
          const result = await reassignTaskAction(taskId, value === UNASSIGNED ? null : value);
          if (result?.warning === "overloaded") {
            toast.warning(tToast("overloaded"));
          }
        });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>{t("unassigned")}</SelectItem>
        {assignees.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
