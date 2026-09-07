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
import { Plus } from "lucide-react";
import { campaignPlatformValues } from "@/lib/validations/campaign";
import { createCampaignAction, type CampaignFormState } from "@/lib/actions/campaign-actions";
import { valuesToSelectItems } from "@/lib/select-items";

export function AddCampaignDialog({ projectId }: { projectId: string }) {
  const t = useTranslations("campaigns");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<CampaignFormState, FormData>(
    createCampaignAction,
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
          <input type="hidden" name="projectId" value={projectId} />
          <div className="flex flex-col gap-2">
            <Label>{t("fields.name")}</Label>
            <Input name="name" required />
            {errorFor("name") && <p className="text-xs font-medium text-destructive">{errorFor("name")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.platform")}</Label>
              <Select
                name="platform"
                defaultValue="META"
                items={valuesToSelectItems(campaignPlatformValues, (value) => t(`platform.${value}`))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaignPlatformValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`platform.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.budget")}</Label>
              <Input name="budget" type="number" min={0} step="0.01" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.startDate")}</Label>
              <Input name="startDate" type="date" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.endDate")}</Label>
              <Input name="endDate" type="date" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.objective")}</Label>
            <Textarea name="objective" rows={2} />
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
