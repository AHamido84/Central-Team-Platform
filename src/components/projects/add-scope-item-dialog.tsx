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
import type { ScopeItemFormState } from "@/lib/actions/project-actions";

export function AddScopeItemDialog({
  action,
}: {
  action: (prevState: ScopeItemFormState, formData: FormData) => Promise<ScopeItemFormState>;
}) {
  const t = useTranslations("projects.scope");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ScopeItemFormState, FormData>(
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

  const errorFor = (field: string) => {
    const key = state?.errors?.[field];
    return key ? tValidation(key) : undefined;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus className="size-4" />
            {t("addItem")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addItem")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.category")}</Label>
              <Select name="category" defaultValue="OTHER">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopeItemCategoryValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`category.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errorFor("category") && (
                <p className="text-xs font-medium text-destructive">{errorFor("category")}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.name")}</Label>
              <Input name="name" required />
              {errorFor("name") && (
                <p className="text-xs font-medium text-destructive">{errorFor("name")}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.quantity")}</Label>
              <Input name="quantity" type="number" min={0} defaultValue={1} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.unit")}</Label>
              <Input name="unit" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.estimatedHours")}</Label>
              <Input name="estimatedHours" type="number" min={0} step="0.5" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.dueDate")}</Label>
              <Input name="dueDate" type="date" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.description")}</Label>
            <Textarea name="description" rows={3} />
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
