"use client";

import { useActionState, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createLeadAction, type LeadFormState } from "@/lib/actions/lead-actions";
import { optionsToSelectItems } from "@/lib/select-items";

type Option = { id: string; label: string };

export function AddLeadDialog({
  clients,
  assignees,
}: {
  clients: Option[];
  assignees: Option[];
}) {
  const t = useTranslations("leads");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<LeadFormState, FormData>(
    createLeadAction,
    undefined,
  );

  const errorFor = (field: string) => {
    const key = state?.errors?.[field];
    return key ? tValidation(key) : undefined;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            {t("newButton")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("fields.client")}</Label>
            <Select name="clientId" items={optionsToSelectItems(clients)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorFor("clientId") && (
              <p className="text-xs font-medium text-destructive">{errorFor("clientId")}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.name")}</Label>
            <Input name="name" required />
            {errorFor("name") && <p className="text-xs font-medium text-destructive">{errorFor("name")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.email")}</Label>
              <Input name="email" type="email" />
              {errorFor("email") && (
                <p className="text-xs font-medium text-destructive">{errorFor("email")}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.phone")}</Label>
              <Input name="phone" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.source")}</Label>
              <Input name="source" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.assignee")}</Label>
              <Select name="assignedToId" items={optionsToSelectItems(assignees)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {tCommon("actions.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
