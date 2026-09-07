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
import { scopeItemCategoryValues } from "@/lib/validations/project";
import { createDeliverableAction, type DeliverableFormState } from "@/lib/actions/deliverable-actions";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";

type Option = { id: string; label: string };

/** Global (project-picker) variant of AddDeliverableDialog, used from the
 * cross-project deliverable library rather than a single project's tab. */
export function UploadDeliverableDialog({ projects }: { projects: Option[] }) {
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
          <div className="flex flex-col gap-2">
            <Label>{t("fields.project")}</Label>
            <Select name="projectId" items={optionsToSelectItems(projects)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorFor("projectId") && (
              <p className="text-xs font-medium text-destructive">{errorFor("projectId")}</p>
            )}
          </div>
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
