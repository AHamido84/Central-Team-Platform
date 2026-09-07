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
import { Plus } from "lucide-react";
import { createProjectTypeAction, type SettingsFormState } from "@/lib/actions/settings-actions";

export function AddProjectTypeDialog() {
  const t = useTranslations("settings.projectTypes");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(
    createProjectTypeAction,
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
