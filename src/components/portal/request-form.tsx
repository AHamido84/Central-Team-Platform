"use client";

import { useActionState, useState } from "react";
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
import { createRequestAction, type CreateRequestState } from "@/lib/actions/request-actions";
import { optionsToSelectItems } from "@/lib/select-items";
import { fieldSetForCategory } from "@/lib/request-type-fields";
import { DynamicRequestFields } from "@/components/requests/dynamic-request-fields";
import type { ScopeItemCategory } from "@prisma/client";

type Option = { id: string; label: string };
type RequestTypeOption = Option & { category: ScopeItemCategory | null };

export function RequestForm({
  projects,
  requestTypes,
  defaultProjectId,
}: {
  projects: Option[];
  requestTypes: RequestTypeOption[];
  defaultProjectId?: string;
}) {
  const t = useTranslations("requests");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [requestTypeId, setRequestTypeId] = useState("");
  const [state, formAction, isPending] = useActionState<CreateRequestState, FormData>(
    createRequestAction,
    undefined,
  );

  const errorFor = (field: string) => {
    const key = state?.errors?.[field];
    return key ? tValidation(key) : undefined;
  };

  const selectedType = requestTypes.find((rt) => rt.id === requestTypeId);
  const fieldSet = fieldSetForCategory(selectedType?.category);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{t("fields.project")}</Label>
        <Select name="projectId" defaultValue={defaultProjectId} items={optionsToSelectItems(projects)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("noProject")} />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("fields.requestType")}</Label>
        <Select
          name="requestTypeId"
          value={requestTypeId}
          onValueChange={(value) => setRequestTypeId(value ?? "")}
          items={optionsToSelectItems(requestTypes)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {requestTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errorFor("requestTypeId") && (
          <p className="text-xs font-medium text-destructive">{errorFor("requestTypeId")}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t("fields.title")}</Label>
        <Input id="title" name="title" required />
        {errorFor("title") && <p className="text-xs font-medium text-destructive">{errorFor("title")}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">{t("fields.description")}</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>

      <DynamicRequestFields fieldSet={fieldSet} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="dueDate">{t("fields.dueDate")}</Label>
        <Input id="dueDate" name="dueDate" type="date" />
      </div>

      {state?.formError && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.formError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {tCommon("actions.submit")}
        </Button>
      </div>
    </form>
  );
}
