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
import { createDeliverableAction, type DeliverableFormState } from "@/lib/actions/deliverable-actions";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";

type Option = { id: string; label: string; version?: number };

export function AddDeliverableDialog({
  projectId,
  tasks,
  existingDeliverables,
}: {
  projectId: string;
  tasks: Option[];
  /** Latest version of every deliverable "family" in this project, so
   * uploading a new version links back via supersedesId instead of creating
   * an unrelated row. */
  existingDeliverables: Option[];
}) {
  const t = useTranslations("deliverables");
  const tCategory = useTranslations("projects.scope.category");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<DeliverableFormState, FormData>(
    createDeliverableAction,
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
            <Label>{t("fields.title")}</Label>
            <Input name="title" required />
            {errorFor("title") && <p className="text-xs font-medium text-destructive">{errorFor("title")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.category")}</Label>
              <Select name="category" items={valuesToSelectItems(scopeItemCategoryValues, tCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
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
              <Label>{t("fields.type")}</Label>
              <Input name="type" placeholder="PDF, MP4..." />
            </div>
            {tasks.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t("fields.task")}</Label>
                <Select name="taskId" items={optionsToSelectItems(tasks)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {existingDeliverables.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>{t("uploadNewVersion")}</Label>
                <Select
                  name="supersedesId"
                  items={Object.fromEntries(
                    existingDeliverables.map((d) => [d.id, `${d.label} (v${d.version})`]),
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {existingDeliverables.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label} (v{d.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>{t("fields.dueDate")}</Label>
              <Input name="dueDate" type="date" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.fileName")}</Label>
              <Input name="fileName" required />
              {errorFor("fileName") && (
                <p className="text-xs font-medium text-destructive">{errorFor("fileName")}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.fileUrl")}</Label>
              <Input name="fileUrl" placeholder="/file.svg" required />
              {errorFor("fileUrl") && (
                <p className="text-xs font-medium text-destructive">{errorFor("fileUrl")}</p>
              )}
            </div>
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
