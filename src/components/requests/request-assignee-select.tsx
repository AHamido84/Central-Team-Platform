"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignRequestAction } from "@/lib/actions/request-actions";

const UNASSIGNED = "__unassigned__";

export function RequestAssigneeSelect({
  requestId,
  currentAssigneeId,
  assignees,
}: {
  requestId: string;
  currentAssigneeId: string | null;
  assignees: { id: string; name: string }[];
}) {
  const t = useTranslations("requests.filters");
  const [isPending, startTransition] = useTransition();
  const items: Record<string, string> = { [UNASSIGNED]: t("unassigned") };
  for (const user of assignees) items[user.id] = user.name;

  return (
    <Select
      value={currentAssigneeId ?? UNASSIGNED}
      disabled={isPending}
      items={items}
      onValueChange={(value) => {
        startTransition(() => {
          void assignRequestAction(requestId, value === UNASSIGNED ? null : value);
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
