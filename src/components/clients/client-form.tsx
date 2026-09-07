"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
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
import { clientStatusValues } from "@/lib/validations/client";
import type { ClientFormState } from "@/lib/actions/client-actions";

type ClientDefaults = {
  companyName?: string;
  legalName?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  notes?: string;
};

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaultValues?: ClientDefaults;
  submitLabel: string;
}) {
  const t = useTranslations("clients.fields");
  const tValidation = useTranslations("validation");
  const tStatus = useTranslations("clients.status");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState<ClientFormState, FormData>(
    action,
    undefined,
  );

  const errorFor = (field: string) => {
    const key = state?.errors?.[field];
    return key ? tValidation(key) : undefined;
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("companyName")} error={errorFor("companyName")}>
          <Input name="companyName" defaultValue={defaultValues?.companyName} required />
        </Field>
        <Field label={t("legalName")} error={errorFor("legalName")}>
          <Input name="legalName" defaultValue={defaultValues?.legalName} />
        </Field>
        <Field label={t("industry")} error={errorFor("industry")}>
          <Input name="industry" defaultValue={defaultValues?.industry} />
        </Field>
        <Field label={t("website")} error={errorFor("website")}>
          <Input name="website" type="url" defaultValue={defaultValues?.website} />
        </Field>
        <Field label={t("email")} error={errorFor("email")}>
          <Input name="email" type="email" defaultValue={defaultValues?.email} />
        </Field>
        <Field label={t("phone")} error={errorFor("phone")}>
          <Input name="phone" defaultValue={defaultValues?.phone} />
        </Field>
        <Field label={t("status")} error={errorFor("status")}>
          <Select name="status" defaultValue={defaultValues?.status ?? "ACTIVE"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clientStatusValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {tStatus(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label={t("address")} error={errorFor("address")}>
        <Textarea name="address" defaultValue={defaultValues?.address} rows={2} />
      </Field>
      <Field label={t("notes")} error={errorFor("notes")}>
        <Textarea name="notes" defaultValue={defaultValues?.notes} rows={4} />
      </Field>
      {state?.formError === "forbidden" && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {tErrors("forbidden.description")}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
