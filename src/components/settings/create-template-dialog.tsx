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
import { createTemplateAction, type TemplateFormState } from "@/lib/actions/request-template-actions";
import { optionsToSelectItems } from "@/lib/select-items";

type Option = { id: string; label: string };

export function CreateTemplateDialog({ requestTypes }: { requestTypes: Option[] }) {
  const t = useTranslations("settings.requestTemplates");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<TemplateFormState, FormData>(
    createTemplateAction,
    undefined,
  );

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
          <DialogTitle>{t("newButton")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("fields.nameAr")}</Label>
            <Input name="nameAr" required dir="rtl" />
            {state?.errors?.nameAr && (
              <p className="text-xs font-medium text-destructive">{state.errors.nameAr}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.nameEn")}</Label>
            <Input name="nameEn" required dir="ltr" />
            {state?.errors?.nameEn && (
              <p className="text-xs font-medium text-destructive">{state.errors.nameEn}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.requestType")}</Label>
            <Select name="requestTypeId" items={optionsToSelectItems(requestTypes)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.requestTypeId && (
              <p className="text-xs font-medium text-destructive">{state.errors.requestTypeId}</p>
            )}
          </div>
          {state?.formError && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {state.formError}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {tCommon("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
