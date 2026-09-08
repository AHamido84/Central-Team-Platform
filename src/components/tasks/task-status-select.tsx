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
import { updateTaskStatusAction } from "@/lib/actions/task-actions";
import { taskStatusValues } from "@/lib/validations/task-status-values";
import { valuesToSelectItems } from "@/lib/select-items";
import type { TaskStatus } from "@prisma/client";

export function TaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const t = useTranslations("tasks.status");
  const tToast = useTranslations("tasks.toast");
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={currentStatus}
      disabled={isPending}
      items={valuesToSelectItems(taskStatusValues, t)}
      onValueChange={(value) => {
        startTransition(async () => {
          try {
            await updateTaskStatusAction(taskId, value as TaskStatus);
          } catch (error) {
            const code = error instanceof Error ? error.message : String(error);
            toast.error(code === "dependencyBlocked" ? tToast("dependencyBlocked") : code);
          }
        });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {taskStatusValues.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
