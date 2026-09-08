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
import { updateTaskAction, type TaskFormState } from "@/lib/actions/task-actions";
import type { Priority } from "@prisma/client";

type Option = { id: string; label: string };

export function EditTaskDialog({
  taskId,
  scopeItems,
  departments,
  initial,
}: {
  taskId: string;
  scopeItems: Option[];
  departments: Option[];
  initial: {
    title: string;
    description: string | null;
    notes: string | null;
    priority: Priority;
    scopeItemId: string | null;
    departmentId: string | null;
    estimatedHours: number | null;
    actualHours: number | null;
    startDate: Date | null;
    dueDate: Date | null;
    clientVisible: boolean;
  };
}) {
  const t = useTranslations("tasks");
  const tPriority = useTranslations("projects.priority");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const action = updateTaskAction.bind(null, taskId);
  const [state, formAction, isPending] = useActionState<TaskFormState, FormData>(action, undefined);
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
            {departments.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.department")}</Label>
                <Select
                  name="departmentId"
                  defaultValue={initial.departmentId ?? undefined}
                  items={optionsToSelectItems(departments)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            <div className="flex flex-col gap-2">
              <Label>{t("fields.estimatedHours")}</Label>
              <Input
                name="estimatedHours"
                type="number"
                min={0}
                step="0.5"
                defaultValue={initial.estimatedHours ?? undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.actualHours")}</Label>
              <Input
                name="actualHours"
                type="number"
                min={0}
                step="0.5"
                defaultValue={initial.actualHours ?? undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.startDate")}</Label>
              <Input name="startDate" type="date" defaultValue={toInputDate(initial.startDate)} />
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="clientVisible"
              defaultChecked={initial.clientVisible}
              className="size-4 rounded border-input"
            />
            {t("fields.clientVisible")}
          </label>
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
