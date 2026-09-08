"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { DynamicFormRenderer, type RenderSection, type FormValues } from "@/components/requests/dynamic-form-renderer";
import { validateFieldValues } from "@/lib/dynamic-field-validation";
import { pickLocalized } from "@/lib/dynamic-form-shared";
import { priorityValues } from "@/lib/validations/project";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";
import {
  createRequestFromTemplateAction,
  createPortalRequestFromTemplateAction,
  type CreateFromTemplateState,
} from "@/lib/actions/request-actions";
import type { Priority } from "@prisma/client";

type Option = { id: string; label: string };
type ProjectOption = Option & { clientId: string };

export type WizardTemplateTask = {
  order: number;
  titleAr: string;
  titleEn: string;
  description: string | null;
  departmentId: string | null;
  defaultPriority: Priority;
  defaultEstimatedHours: number | null;
  clientVisible: boolean;
  dependsOnOrder: number | null;
};

export type WizardTemplate = {
  id: string;
  requestTypeId: string;
  icon: string | null;
  versionId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  defaultPriority: Priority;
  defaultDurationDays: number | null;
  sections: RenderSection[];
  tasks: WizardTemplateTask[];
};

type TaskRow = {
  key: string;
  title: string;
  description: string;
  departmentId: string;
  assigneeId: string;
  priority: Priority;
  estimatedHours: string;
  dueDate: string;
  dependsOnKeys: string[];
};

let uid = 0;
function nextKey() {
  uid += 1;
  return `wt-${uid}`;
}

export function TemplateRequestWizard({
  isPortal,
  clients = [],
  projects,
  requestTypes,
  templates,
  departments,
  assignees,
  defaultClientId,
}: {
  isPortal: boolean;
  clients?: Option[];
  projects: ProjectOption[];
  requestTypes: Option[];
  templates: WizardTemplate[];
  departments: Option[];
  assignees: Option[];
  defaultClientId?: string;
}) {
  const t = useTranslations("requests");
  const tCommon = useTranslations("common");
  const tPriority = useTranslations("projects.priority");
  const tValidation = useTranslations("validation");

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [projectId, setProjectId] = useState("");
  const [requestTypeId, setRequestTypeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [values, setValues] = useState<FormValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const uiLocale = useLocale();

  const projectsForClient = isPortal ? projects : projects.filter((p) => !clientId || p.clientId === clientId);
  const templatesForType = templates.filter((tpl) => tpl.requestTypeId === requestTypeId);
  const selectedTemplate = templates.find((tpl) => tpl.id === templateId) ?? null;

  const allFieldDefs = useMemo(
    () =>
      (selectedTemplate?.sections ?? []).flatMap((section) =>
        section.fields.map((field) => ({
          key: field.key,
          type: field.type,
          required: field.required,
          options: field.options,
          visibleIfFieldKey: field.visibleIfFieldKey,
          visibleIfValue: field.visibleIfValue,
        })),
      ),
    [selectedTemplate],
  );

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((tpl) => tpl.id === id);
    setValues({});
    setFieldErrors({});
    if (!template) {
      setTasks([]);
      return;
    }
    if (!title.trim()) setTitle(pickLocalized(template.nameAr, template.nameEn, uiLocale));
    const keyForOrder = (order: number) => `tpl-${order}`;
    setTasks(
      template.tasks.map((task) => ({
        key: keyForOrder(task.order),
        title: pickLocalized(task.titleAr, task.titleEn, uiLocale),
        description: task.description ?? "",
        departmentId: task.departmentId ?? "",
        assigneeId: "",
        priority: task.defaultPriority,
        estimatedHours: task.defaultEstimatedHours != null ? String(task.defaultEstimatedHours) : "",
        dueDate: "",
        dependsOnKeys: task.dependsOnOrder != null ? [keyForOrder(task.dependsOnOrder)] : [],
      })),
    );
  }

  function updateTaskRow(index: number, patch: Partial<TaskRow>) {
    setTasks((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeTaskRow(index: number) {
    const removedKey = tasks[index].key;
    setTasks((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((row) => ({ ...row, dependsOnKeys: row.dependsOnKeys.filter((k) => k !== removedKey) })),
    );
  }
  function moveTaskRow(index: number, direction: -1 | 1) {
    setTasks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function addTaskRow() {
    setTasks((prev) => [
      ...prev,
      {
        key: nextKey(),
        title: "",
        description: "",
        departmentId: "",
        assigneeId: "",
        priority: "MEDIUM",
        estimatedHours: "",
        dueDate: "",
        dependsOnKeys: [],
      },
    ]);
  }

  function submit() {
    setFormError(null);
    if (!clientId || !projectId || !requestTypeId || !title.trim()) {
      setFormError(tValidation("required"));
      return;
    }
    if (selectedTemplate) {
      const errors = validateFieldValues(allFieldDefs, values);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setFormError(tValidation("required"));
        return;
      }
    }

    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("projectId", projectId);
    formData.set("templateVersionId", selectedTemplate?.versionId ?? "");
    formData.set("title", title);
    formData.set("description", description);
    formData.set("requestedDate", requestedDate);
    formData.set("dueDate", dueDate);
    formData.set("valuesJson", JSON.stringify(values));
    formData.set(
      "taskDraftsJson",
      JSON.stringify(
        tasks
          .filter((row) => row.title.trim())
          .map((row) => ({
            key: row.key,
            title: row.title,
            description: row.description || undefined,
            departmentId: row.departmentId || undefined,
            assigneeId: row.assigneeId || undefined,
            priority: row.priority,
            estimatedHours: row.estimatedHours ? Number(row.estimatedHours) : undefined,
            dueDate: row.dueDate || undefined,
            dependsOnKeys: row.dependsOnKeys,
          })),
      ),
    );

    startTransition(async () => {
      const action = isPortal ? createPortalRequestFromTemplateAction : createRequestFromTemplateAction;
      const result: CreateFromTemplateState = await action(undefined, formData);
      if (result?.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        toast.error(tValidation("required"));
        return;
      }
      if (result?.formError) {
        toast.error(result.formError);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("wizard.selectContext")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {!isPortal && (
            <div className="flex flex-col gap-2">
              <Label>{t("fields.client")}</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v ?? ""); setProjectId(""); }} items={optionsToSelectItems(clients)}>
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
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>{t("fields.project")}</Label>
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")} items={optionsToSelectItems(projectsForClient)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectsForClient.map((p) => (
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
              value={requestTypeId}
              onValueChange={(v) => {
                setRequestTypeId(v ?? "");
                setTemplateId("");
                setTasks([]);
              }}
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
          </div>
          {requestTypeId && (
            <div className="flex flex-col gap-2">
              <Label>{t("wizard.template")}</Label>
              <Select
                value={templateId}
                onValueChange={(v) => applyTemplate(v ?? "")}
                items={{
                  "": t("template.skip"),
                  ...optionsToSelectItems(
                    templatesForType.map((tpl) => ({ id: tpl.id, label: pickLocalized(tpl.nameAr, tpl.nameEn, uiLocale) })),
                  ),
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("template.skip")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("template.skip")}</SelectItem>
                  {templatesForType.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {pickLocalized(tpl.nameAr, tpl.nameEn, uiLocale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templatesForType.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("template.noneAvailable")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (selectedTemplate.descriptionAr || selectedTemplate.descriptionEn) && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {pickLocalized(selectedTemplate.descriptionAr ?? "", selectedTemplate.descriptionEn ?? "", uiLocale)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.sections.info")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>{t("fields.title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>{t("fields.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.requestedDate")}</Label>
            <Input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.dueDate")}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && selectedTemplate.sections.length > 0 && (
        <DynamicFormRenderer
          sections={selectedTemplate.sections}
          values={values}
          onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
          errors={fieldErrors}
          locale={uiLocale}
          errorLabel={(code) => tValidation(code as "required")}
        />
      )}

      {selectedTemplate && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">{t("detail.sections.tasks")}</h2>
            <Button type="button" size="sm" variant="outline" onClick={addTaskRow}>
              <Plus className="size-4" />
              {tCommon("actions.add")}
            </Button>
          </div>
          {tasks.map((row, index) => (
            <Card key={row.key}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex items-start gap-2">
                  <Input value={row.title} onChange={(e) => updateTaskRow(index, { title: e.target.value })} className="flex-1" />
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveTaskRow(index, -1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveTaskRow(index, 1)}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeTaskRow(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Select value={row.departmentId} onValueChange={(v) => updateTaskRow(index, { departmentId: v ?? "" })} items={optionsToSelectItems(departments)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={row.assigneeId} onValueChange={(v) => updateTaskRow(index, { assigneeId: v ?? "" })} items={optionsToSelectItems(assignees)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={row.priority} onValueChange={(v) => updateTaskRow(index, { priority: (v as Priority) ?? "MEDIUM" })} items={valuesToSelectItems(priorityValues, tPriority)}>
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
                  <Input type="number" min={0} step="0.5" value={row.estimatedHours} onChange={(e) => updateTaskRow(index, { estimatedHours: e.target.value })} />
                </div>
                {tasks.length > 1 && (
                  <div className="flex flex-wrap gap-3 border-t border-border pt-3">
                    {tasks
                      .filter((r) => r.key !== row.key)
                      .map((other) => (
                        <label key={other.key} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={row.dependsOnKeys.includes(other.key)}
                            onCheckedChange={(checked) =>
                              updateTaskRow(index, {
                                dependsOnKeys: checked
                                  ? [...row.dependsOnKeys, other.key]
                                  : row.dependsOnKeys.filter((k) => k !== other.key),
                              })
                            }
                          />
                          {other.title || "—"}
                        </label>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {formError && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {formError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="button" disabled={isPending} onClick={submit}>
          {tCommon("actions.submit")}
        </Button>
      </div>
    </div>
  );
}
