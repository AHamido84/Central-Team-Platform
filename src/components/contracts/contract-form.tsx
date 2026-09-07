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
import { contractStatusValues } from "@/lib/validations/contract";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";
import type { ContractFormState } from "@/lib/actions/contract-actions";

type Option = { id: string; label: string };

type ContractDefaults = {
  clientId?: string;
  title?: string;
  contractNumber?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  value?: string;
  currency?: string;
  paymentTerms?: string;
  status?: string;
  fileUrl?: string;
  notes?: string;
};

export function ContractForm({
  action,
  clients,
  submitLabel,
  defaultValues,
}: {
  action: (prevState: ContractFormState, formData: FormData) => Promise<ContractFormState>;
  clients: Option[];
  submitLabel: string;
  defaultValues?: ContractDefaults;
}) {
  const t = useTranslations("contracts.fields");
  const tValidation = useTranslations("validation");
  const tStatus = useTranslations("contracts.status");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState<ContractFormState, FormData>(
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
        <Field label={t("client")} error={errorFor("clientId")}>
          <Select name="clientId" defaultValue={defaultValues?.clientId} items={optionsToSelectItems(clients)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("title")} error={errorFor("title")}>
          <Input name="title" defaultValue={defaultValues?.title} required />
        </Field>
        <Field label={t("contractNumber")} error={errorFor("contractNumber")}>
          <Input name="contractNumber" defaultValue={defaultValues?.contractNumber} />
        </Field>
        <Field label={t("type")} error={errorFor("type")}>
          <Input name="type" defaultValue={defaultValues?.type} />
        </Field>
        <Field label={t("status")} error={errorFor("status")}>
          <Select
            name="status"
            defaultValue={defaultValues?.status ?? "DRAFT"}
            items={valuesToSelectItems(contractStatusValues, tStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contractStatusValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {tStatus(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("startDate")} error={errorFor("startDate")}>
          <Input type="date" name="startDate" defaultValue={defaultValues?.startDate} />
        </Field>
        <Field label={t("endDate")} error={errorFor("endDate")}>
          <Input type="date" name="endDate" defaultValue={defaultValues?.endDate} />
        </Field>
        <Field label={t("value")} error={errorFor("value")}>
          <Input name="value" type="number" min={0} step="0.01" defaultValue={defaultValues?.value} />
        </Field>
        <Field label={t("currency")} error={errorFor("currency")}>
          <Input name="currency" defaultValue={defaultValues?.currency ?? "SAR"} />
        </Field>
        <Field label={t("fileUrl")} error={errorFor("fileUrl")}>
          <Input name="fileUrl" defaultValue={defaultValues?.fileUrl} />
        </Field>
      </div>
      <Field label={t("paymentTerms")} error={errorFor("paymentTerms")}>
        <Textarea name="paymentTerms" defaultValue={defaultValues?.paymentTerms} rows={2} />
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
