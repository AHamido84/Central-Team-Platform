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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createOpportunityAction, type OpportunityFormState } from "@/lib/actions/opportunity-actions";
import { optionsToSelectItems } from "@/lib/select-items";

type Option = { id: string; label: string };

export function AddOpportunityDialog({
  clients,
  owners,
}: {
  clients: Option[];
  owners: Option[];
}) {
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<OpportunityFormState, FormData>(
    createOpportunityAction,
    undefined,
  );
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !isPending && !state?.errors && !state?.formError) {
      setOpen(false);
    }
    wasPendingRef.current = isPending;
  }, [isPending, state]);

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
            <Label>{t("fields.title")}</Label>
            <Input name="title" required />
            {errorFor("title") && <p className="text-xs font-medium text-destructive">{errorFor("title")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.value")}</Label>
              <Input name="value" type="number" min={0} step="0.01" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.probability")}</Label>
              <Input name="probability" type="number" min={0} max={100} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.expectedCloseDate")}</Label>
              <Input name="expectedCloseDate" type="date" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.owner")}</Label>
              <Select name="ownerId" items={optionsToSelectItems(owners)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.label}
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
