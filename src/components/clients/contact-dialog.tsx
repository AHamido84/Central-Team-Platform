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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { contactMethodValues } from "@/lib/validations/contact";
import { valuesToSelectItems } from "@/lib/select-items";
import type { ContactFormState } from "@/lib/actions/contact-actions";

type ContactDefaults = {
  name?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  preferredContactMethod?: string;
  notes?: string;
  isPrimary?: boolean;
};

export function ContactDialog({
  action,
  defaultValues,
  mode,
}: {
  action: (prevState: ContactFormState, formData: FormData) => Promise<ContactFormState>;
  defaultValues?: ContactDefaults;
  mode: "create" | "edit";
}) {
  const t = useTranslations("contacts");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ContactFormState, FormData>(
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
          mode === "create" ? (
            <Button size="sm">
              <Plus className="size-4" />
              {t("addButton")}
            </Button>
          ) : (
            <Button variant="outline" size="icon-sm" aria-label={t("editTitle")}>
              <Pencil className="size-4" />
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("addButton") : t("editTitle")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.name")}</Label>
              <Input name="name" defaultValue={defaultValues?.name} required />
              {errorFor("name") && (
                <p className="text-xs font-medium text-destructive">{errorFor("name")}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.position")}</Label>
              <Input name="position" defaultValue={defaultValues?.position} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.department")}</Label>
              <Input name="department" defaultValue={defaultValues?.department} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.email")}</Label>
              <Input name="email" type="email" defaultValue={defaultValues?.email} />
              {errorFor("email") && (
                <p className="text-xs font-medium text-destructive">{errorFor("email")}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.phone")}</Label>
              <Input name="phone" defaultValue={defaultValues?.phone} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.whatsapp")}</Label>
              <Input name="whatsapp" defaultValue={defaultValues?.whatsapp} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.preferredContactMethod")}</Label>
              <Select
                name="preferredContactMethod"
                defaultValue={defaultValues?.preferredContactMethod}
                items={valuesToSelectItems(contactMethodValues, (value) => t(`contactMethod.${value}`))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contactMethodValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`contactMethod.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox name="isPrimary" id="isPrimary" defaultChecked={defaultValues?.isPrimary} />
              <Label htmlFor="isPrimary" className="font-normal">
                {t("fields.isPrimary")}
              </Label>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.notes")}</Label>
            <Textarea name="notes" defaultValue={defaultValues?.notes} rows={3} />
          </div>
          {state?.formError && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {state.formError}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {mode === "create" ? tCommon("actions.add") : tCommon("actions.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
