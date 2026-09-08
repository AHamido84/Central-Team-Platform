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
import { priorityValues } from "@/lib/validations/project";
import { createTaskAction, type TaskFormState } from "@/lib/actions/task-actions";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";

type Option = { id: string; label: string };

export function AddTaskDialog({
  projectId,
  requestId,
  scopeItems,
  departments = [],
  assignees,
}: {
  projectId: string;
  requestId?: string;
  scopeItems: Option[];
  departments?: Option[];
  assignees: Option[];
}) {
  const t = useTranslations("tasks");
  const tPriority = useTranslations("projects.priority");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<TaskFormState, FormData>(
    createTaskAction,
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
          {requestId && <input type="hidden" name="requestId" value={requestId} />}
          <div className="flex flex-col gap-2">
            <Label>{t("fields.title")}</Label>
            <Input name="title" required />
            {errorFor("title") && <p className="text-xs font-medium text-destructive">{errorFor("title")}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.description")}</Label>
            <Textarea name="description" rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {scopeItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.scopeItem")}</Label>
                <Select name="scopeItemId" items={optionsToSelectItems(scopeItems)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {departments.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.department")}</Label>
                <Select name="departmentId" items={optionsToSelectItems(departments)}>
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
            <div className="flex flex-col gap-2">
              <Label>{t("fields.assignee")}</Label>
              <Select name="assigneeId" items={optionsToSelectItems(assignees)}>
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
            <div className="flex flex-col gap-2">
              <Label>{t("fields.priority")}</Label>
              <Select
                name="priority"
                defaultValue="MEDIUM"
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
            <div className="flex flex-col gap-2">
              <Label>{t("fields.estimatedHours")}</Label>
              <Input name="estimatedHours" type="number" min={0} step="0.5" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.startDate")}</Label>
              <Input name="startDate" type="date" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.dueDate")}</Label>
              <Input name="dueDate" type="date" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="clientVisible" defaultChecked className="size-4 rounded border-input" />
            {t("fields.clientVisible")}
          </label>
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
