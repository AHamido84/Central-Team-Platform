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
import { projectStatusValues, priorityValues } from "@/lib/validations/project";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";
import type { ProjectFormState } from "@/lib/actions/project-actions";

type Option = { id: string; label: string };

export function ProjectForm({
  action,
  clients,
  projectTypes,
  internalUsers,
  contracts,
  submitLabel,
  defaultValues,
}: {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  clients: Option[];
  projectTypes: Option[];
  internalUsers: Option[];
  contracts: Option[];
  submitLabel: string;
  defaultValues?: {
    clientId?: string;
    contractId?: string;
    projectTypeId?: string;
    name?: string;
    projectCode?: string;
    description?: string;
    status?: string;
    priority?: string;
    startDate?: string;
    dueDate?: string;
    budget?: string;
    currency?: string;
    ownerId?: string;
    accountManagerId?: string;
  };
}) {
  const t = useTranslations("projects.fields");
  const tValidation = useTranslations("validation");
  const tStatus = useTranslations("projects.status");
  const tPriority = useTranslations("projects.priority");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState<ProjectFormState, FormData>(
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
        <Field label={t("name")} error={errorFor("name")}>
          <Input name="name" defaultValue={defaultValues?.name} required />
        </Field>
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
        <Field label={t("contract")} error={errorFor("contractId")}>
          <Select name="contractId" defaultValue={defaultValues?.contractId} items={optionsToSelectItems(contracts)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("projectCode")} error={errorFor("projectCode")}>
          <Input name="projectCode" defaultValue={defaultValues?.projectCode} />
        </Field>
        <Field label={t("projectType")} error={errorFor("projectTypeId")}>
          <Select
            name="projectTypeId"
            defaultValue={defaultValues?.projectTypeId}
            items={optionsToSelectItems(projectTypes)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectTypes.map((pt) => (
                <SelectItem key={pt.id} value={pt.id}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("status")} error={errorFor("status")}>
          <Select
            name="status"
            defaultValue={defaultValues?.status ?? "PLANNED"}
            items={valuesToSelectItems(projectStatusValues, tStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectStatusValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {tStatus(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("priority")} error={errorFor("priority")}>
          <Select
            name="priority"
            defaultValue={defaultValues?.priority ?? "MEDIUM"}
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
        </Field>
        <Field label={t("owner")} error={errorFor("ownerId")}>
          <Select name="ownerId" defaultValue={defaultValues?.ownerId} items={optionsToSelectItems(internalUsers)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {internalUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("accountManager")} error={errorFor("accountManagerId")}>
          <Select
            name="accountManagerId"
            defaultValue={defaultValues?.accountManagerId}
            items={optionsToSelectItems(internalUsers)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {internalUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("startDate")} error={errorFor("startDate")}>
          <Input type="date" name="startDate" defaultValue={defaultValues?.startDate} />
        </Field>
        <Field label={t("dueDate")} error={errorFor("dueDate")}>
          <Input type="date" name="dueDate" defaultValue={defaultValues?.dueDate} />
        </Field>
        <Field label={t("budget")} error={errorFor("budget")}>
          <Input name="budget" type="number" min={0} step="0.01" defaultValue={defaultValues?.budget} />
        </Field>
        <Field label={t("currency")} error={errorFor("currency")}>
          <Input name="currency" defaultValue={defaultValues?.currency ?? "SAR"} />
        </Field>
      </div>
      <Field label={t("description")} error={errorFor("description")}>
        <Textarea name="description" defaultValue={defaultValues?.description} rows={4} />
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
