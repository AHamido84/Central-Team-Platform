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
import { updateRequestStatusAction } from "@/lib/actions/request-actions";
import { requestStatusValues } from "@/lib/validations/request-status-values";
import { valuesToSelectItems } from "@/lib/select-items";
import type { RequestStatus } from "@prisma/client";

export function RequestStatusSelect({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: RequestStatus;
}) {
  const t = useTranslations("requests.status");
  const tErrors = useTranslations("requests.errors");
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={currentStatus}
      disabled={isPending}
      items={valuesToSelectItems(requestStatusValues, t)}
      onValueChange={(value) => {
        startTransition(async () => {
          const result = await updateRequestStatusAction(requestId, value as RequestStatus);
          if (result?.formError === "tasksIncomplete") {
            toast.error(tErrors("tasksIncomplete"));
          }
        });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {requestStatusValues.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
