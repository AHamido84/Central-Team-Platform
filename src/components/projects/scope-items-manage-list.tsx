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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Pencil } from "lucide-react";
import {
  scopeItemCategoryValues,
  scopeProgressModeValues,
  type ScopeItemFormValues,
} from "@/lib/validations/project";
import { valuesToSelectItems } from "@/lib/select-items";
import {
  updateScopeItemAction,
  deleteScopeItemAction,
  type ScopeItemFormState,
} from "@/lib/actions/project-actions";

type ManagedScopeItem = {
  id: string;
  category: (typeof scopeItemCategoryValues)[number];
  name: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  status: string;
  progressMode: (typeof scopeProgressModeValues)[number];
  manualProgressPercent: number | null;
  weight: number | null;
  estimatedHours: number | null;
  dueDate: Date | null;
};

export function ScopeItemsManageList({
  projectId,
  items,
}: {
  projectId: string;
  items: ManagedScopeItem[];
}) {
  const t = useTranslations("projects.scope");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-muted-foreground">{t("title")}</h3>
      <div className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{item.name}</span>
                <Badge variant="secondary">{t(`category.${item.category}`)}</Badge>
                <Badge variant="outline">{t(`progressMode.${item.progressMode}`)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.quantity ?? "—"} {item.unit ?? ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <EditScopeItemDialog projectId={projectId} item={item} />
              <ConfirmDeleteDialog
                action={deleteScopeItemAction.bind(null, item.id, projectId)}
                title={t("deleteItem")}
                description={t("deleteItemConfirm")}
                confirmLabel={t("deleteItem")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditScopeItemDialog({
  projectId,
  item,
}: {
  projectId: string;
  item: ManagedScopeItem;
}) {
  const t = useTranslations("projects.scope");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [progressMode, setProgressMode] = useState<ScopeItemFormValues["progressMode"]>(
    item.progressMode,
  );
  const action = updateScopeItemAction.bind(null, item.id, projectId);
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
          <Button variant="outline" size="icon-sm" aria-label={t("editItem")}>
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editItem")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.category")}</Label>
              <Select
                name="category"
                defaultValue={item.category}
                items={valuesToSelectItems(scopeItemCategoryValues, (value) => t(`category.${value}`))}
              >
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
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.name")}</Label>
              <Input name="name" defaultValue={item.name} required />
              {errorFor("name") && (
                <p className="text-xs font-medium text-destructive">{errorFor("name")}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.quantity")}</Label>
              <Input name="quantity" type="number" min={0} defaultValue={item.quantity ?? undefined} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.unit")}</Label>
              <Input name="unit" defaultValue={item.unit ?? undefined} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.estimatedHours")}</Label>
              <Input
                name="estimatedHours"
                type="number"
                min={0}
                step="0.5"
                defaultValue={item.estimatedHours ?? undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.dueDate")}</Label>
              <Input
                name="dueDate"
                type="date"
                defaultValue={item.dueDate ? item.dueDate.toISOString().slice(0, 10) : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.progressMode")}</Label>
              <Select
                name="progressMode"
                defaultValue={item.progressMode}
                items={valuesToSelectItems(scopeProgressModeValues, (value) => t(`progressMode.${value}`))}
                onValueChange={(value) => setProgressMode(value as ScopeItemFormValues["progressMode"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopeProgressModeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`progressMode.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {progressMode === "MANUAL" && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.manualProgressPercent")}</Label>
                <Input
                  name="manualProgressPercent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={item.manualProgressPercent ?? 0}
                />
              </div>
            )}
            {progressMode === "WEIGHTED" && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.weight")}</Label>
                <Input name="weight" type="number" min={0} defaultValue={item.weight ?? undefined} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.description")}</Label>
            <Textarea name="description" defaultValue={item.description ?? undefined} rows={3} />
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
