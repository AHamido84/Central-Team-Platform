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
import { scopeItemCategoryValues } from "@/lib/validations/project";
import { createRequestTypeAction, type SettingsFormState } from "@/lib/actions/settings-actions";
import { valuesToSelectItems } from "@/lib/select-items";

export function AddRequestTypeDialog() {
  const t = useTranslations("settings.requestTypes");
  const tCategory = useTranslations("projects.scope.category");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(
    createRequestTypeAction,
    undefined,
  );
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !isPending && !state?.errors && !state?.formError) {
      setOpen(false);
    }
    wasPendingRef.current = isPending;
  }, [isPending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus className="size-4" />
            {t("addButton")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addButton")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("fields.name")}</Label>
            <Input name="name" required />
            {state?.errors?.name && (
              <p className="text-xs font-medium text-destructive">{state.errors.name}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.category")}</Label>
            <Select name="category" items={valuesToSelectItems(scopeItemCategoryValues, tCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("noCategory")} />
              </SelectTrigger>
              <SelectContent>
                {scopeItemCategoryValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {tCategory(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.description")}</Label>
            <Textarea name="description" rows={2} />
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
