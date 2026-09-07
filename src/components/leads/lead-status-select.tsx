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
import { updateLeadStatusAction } from "@/lib/actions/lead-actions";
import { leadStatusValues } from "@/lib/validations/lead";
import { valuesToSelectItems } from "@/lib/select-items";
import type { LeadStatus } from "@prisma/client";

export function LeadStatusSelect({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const t = useTranslations("leads.status");
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={currentStatus}
      disabled={isPending}
      items={valuesToSelectItems(leadStatusValues, t)}
      onValueChange={(value) => {
        startTransition(() => {
          void updateLeadStatusAction(leadId, value as LeadStatus);
        });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {leadStatusValues.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
