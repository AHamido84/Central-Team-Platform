"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { priorityValues } from "@/lib/validations/project";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";
import { updateRequestAction, type CreateRequestState } from "@/lib/actions/request-actions";
import type { Priority } from "@prisma/client";

type Option = { id: string; label: string };

export function EditRequestDialog({
  requestId,
  scopeItems,
  campaigns,
  initial,
}: {
  requestId: string;
  scopeItems: Option[];
  campaigns: Option[];
  initial: {
    title: string;
    description: string | null;
    notes: string | null;
    priority: Priority;
    scopeItemId: string | null;
    campaignId: string | null;
    requestedDate: Date | null;
    dueDate: Date | null;
  };
}) {
  const t = useTranslations("requests");
  const tPriority = useTranslations("projects.priority");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const action = updateRequestAction.bind(null, requestId);
  const [state, formAction, isPending] = useActionState<CreateRequestState, FormData>(
    action,
    undefined,
  );
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !isPending && !state?.errors && !state?.formError) {
      setOpen(false);
    }
    wasPendingRef.current = isPending;
  }, [isPending, state]);

  const toInputDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            {tCommon("actions.edit")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("fields.title")}</Label>
            <Input name="title" defaultValue={initial.title} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.description")}</Label>
            <Textarea name="description" defaultValue={initial.description ?? undefined} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.priority")}</Label>
              <Select
                name="priority"
                defaultValue={initial.priority}
                items={valuesToSelectItems(priorityValues, tPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tPriority(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {scopeItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.scopeItem")}</Label>
                <Select
                  name="scopeItemId"
                  defaultValue={initial.scopeItemId ?? undefined}
                  items={optionsToSelectItems(scopeItems)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeItems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {campaigns.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.campaign")}</Label>
                <Select
                  name="campaignId"
                  defaultValue={initial.campaignId ?? undefined}
                  items={optionsToSelectItems(campaigns)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>{t("fields.requestedDate")}</Label>
              <Input name="requestedDate" type="date" defaultValue={toInputDate(initial.requestedDate)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.dueDate")}</Label>
              <Input name="dueDate" type="date" defaultValue={toInputDate(initial.dueDate)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.notes")}</Label>
            <Textarea name="notes" defaultValue={initial.notes ?? undefined} rows={2} />
          </div>
          {state?.formError && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {state.formError}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {tCommon("actions.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
