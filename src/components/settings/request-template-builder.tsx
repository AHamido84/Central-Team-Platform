"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, Trash2, Plus, Send, Save } from "lucide-react";
import { priorityValues } from "@/lib/validations/project";
import {
  templateFieldTypeValues,
  OPTION_BASED_FIELD_TYPES,
  type TemplateDraftValues,
} from "@/lib/validations/request-template";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";
import {
  saveTemplateDraftAction,
  publishTemplateAction,
} from "@/lib/actions/request-template-actions";
import type { Priority, TemplateFieldType } from "@prisma/client";

type Option = { id: string; label: string };

type FieldOptionRow = { labelAr: string; labelEn: string; value: string; order: number; isActive: boolean };
type FieldRow = {
  key: string;
  labelAr: string;
  labelEn: string;
  description: string;
  placeholder: string;
  type: TemplateFieldType;
  required: boolean;
  order: number;
  defaultValue: string;
  minValue: string;
  maxValue: string;
  minLength: string;
  maxLength: string;
  visibleIfFieldKey: string;
  visibleIfValue: string;
  options: FieldOptionRow[];
};
type SectionRow = { titleAr: string; titleEn: string; order: number; fields: FieldRow[] };
type TaskRow = {
  key: string;
  order: number;
  titleAr: string;
  titleEn: string;
  description: string;
  departmentId: string;
  defaultPriority: Priority;
  defaultEstimatedHours: string;
  clientVisible: boolean;
  dependsOnOrder: number | null;
};

let uid = 0;
function nextKey(prefix: string) {
  uid += 1;
  return `${prefix}-${uid}`;
}

function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `field_${uid}`;
}

export function RequestTemplateBuilder({
  templateId,
  requestTypes,
  departments,
  initial,
  isPublished,
}: {
  templateId: string;
  requestTypes: Option[];
  departments: Option[];
  initial: TemplateDraftValues;
  /** Whether the template has ever been published — informational only,
   * the draft being edited here is always the unpublished version. */
  isPublished: boolean;
}) {
  const t = useTranslations("settings.requestTemplates");
  const tFieldType = useTranslations("settings.requestTemplates.fieldTypes");
  const tPriority = useTranslations("projects.priority");
  const tCommon = useTranslations("common");

  const [basicInfo, setBasicInfo] = useState(initial.basicInfo);
  const [sections, setSections] = useState<SectionRow[]>(
    initial.sections.map((s) => ({
      titleAr: s.titleAr,
      titleEn: s.titleEn,
      order: s.order,
      fields: s.fields.map((f) => ({
        key: f.key,
        labelAr: f.labelAr,
        labelEn: f.labelEn,
        description: f.description ?? "",
        placeholder: f.placeholder ?? "",
        type: f.type,
        required: f.required,
        order: f.order,
        defaultValue: f.defaultValue ?? "",
        minValue: f.minValue?.toString() ?? "",
        maxValue: f.maxValue?.toString() ?? "",
        minLength: f.minLength?.toString() ?? "",
        maxLength: f.maxLength?.toString() ?? "",
        visibleIfFieldKey: f.visibleIfFieldKey ?? "",
        visibleIfValue: f.visibleIfValue ?? "",
        options: (f.options ?? []).map((o) => ({ ...o })),
      })),
    })),
  );
  const [tasks, setTasks] = useState<TaskRow[]>(
    initial.tasks.map((task) => ({
      key: nextKey("task"),
      order: task.order,
      titleAr: task.titleAr,
      titleEn: task.titleEn,
      description: task.description ?? "",
      departmentId: task.departmentId ?? "",
      defaultPriority: task.defaultPriority,
      defaultEstimatedHours: task.defaultEstimatedHours?.toString() ?? "",
      clientVisible: task.clientVisible,
      dependsOnOrder: task.dependsOnOrder ?? null,
    })),
  );
  const [isPending, startTransition] = useTransition();

  const allFieldsFlat = sections.flatMap((s) => s.fields);
  const allFieldKeys = allFieldsFlat.map((f) => f.key);
  const fieldByKey = new Map(allFieldsFlat.map((f) => [f.key, f]));

  function addSection() {
    setSections((prev) => [
      ...prev,
      { titleAr: "", titleEn: "", order: prev.length, fields: [] },
    ]);
  }
  function updateSection(index: number, patch: Partial<SectionRow>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }
  function moveSection(index: number, direction: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  function addField(sectionIndex: number) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  key: slugify(`field_${s.fields.length + 1}_${nextKey("f")}`),
                  labelAr: "",
                  labelEn: "",
                  description: "",
                  placeholder: "",
                  type: "TEXT" as TemplateFieldType,
                  required: false,
                  order: s.fields.length,
                  defaultValue: "",
                  minValue: "",
                  maxValue: "",
                  minLength: "",
                  maxLength: "",
                  visibleIfFieldKey: "",
                  visibleIfValue: "",
                  options: [],
                },
              ],
            }
          : s,
      ),
    );
  }
  function updateField(sectionIndex: number, fieldIndex: number, patch: Partial<FieldRow>) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, fields: s.fields.map((f, j) => (j === fieldIndex ? { ...f, ...patch } : f)) }
          : s,
      ),
    );
  }
  function removeField(sectionIndex: number, fieldIndex: number) {
    setSections((prev) =>
      prev.map((s, i) => (i === sectionIndex ? { ...s, fields: s.fields.filter((_, j) => j !== fieldIndex) } : s)),
    );
  }
  function moveField(sectionIndex: number, fieldIndex: number, direction: -1 | 1) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        const next = [...s.fields];
        const target = fieldIndex + direction;
        if (target < 0 || target >= next.length) return s;
        [next[fieldIndex], next[target]] = [next[target], next[fieldIndex]];
        return { ...s, fields: next.map((f, j) => ({ ...f, order: j })) };
      }),
    );
  }

  function addOption(sectionIndex: number, fieldIndex: number) {
    updateField(sectionIndex, fieldIndex, {
      options: [
        ...sections[sectionIndex].fields[fieldIndex].options,
        { labelAr: "", labelEn: "", value: "", order: sections[sectionIndex].fields[fieldIndex].options.length, isActive: true },
      ],
    });
  }
  function updateOption(sectionIndex: number, fieldIndex: number, optionIndex: number, patch: Partial<FieldOptionRow>) {
    const field = sections[sectionIndex].fields[fieldIndex];
    updateField(sectionIndex, fieldIndex, {
      options: field.options.map((o, i) => (i === optionIndex ? { ...o, ...patch } : o)),
    });
  }
  function removeOption(sectionIndex: number, fieldIndex: number, optionIndex: number) {
    const field = sections[sectionIndex].fields[fieldIndex];
    updateField(sectionIndex, fieldIndex, { options: field.options.filter((_, i) => i !== optionIndex) });
  }

  function addTask() {
    setTasks((prev) => [
      ...prev,
      {
        key: nextKey("task"),
        order: prev.length,
        titleAr: "",
        titleEn: "",
        description: "",
        departmentId: "",
        defaultPriority: "MEDIUM",
        defaultEstimatedHours: "",
        clientVisible: true,
        dependsOnOrder: null,
      },
    ]);
  }
  function updateTask(index: number, patch: Partial<TaskRow>) {
    setTasks((prev) => prev.map((task, i) => (i === index ? { ...task, ...patch } : task)));
  }
  function removeTask(index: number) {
    const removedOrder = tasks[index].order;
    setTasks((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((task) => (task.dependsOnOrder === removedOrder ? { ...task, dependsOnOrder: null } : task)),
    );
  }
  function moveTask(index: number, direction: -1 | 1) {
    setTasks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((task, i) => ({ ...task, order: i }));
    });
  }

  function buildDraft(): TemplateDraftValues {
    return {
      basicInfo: {
        ...basicInfo,
        defaultDurationDays: basicInfo.defaultDurationDays ?? null,
      },
      sections: sections.map((s, i) => ({
        titleAr: s.titleAr,
        titleEn: s.titleEn,
        order: i,
        fields: s.fields.map((f, j) => ({
          key: f.key,
          labelAr: f.labelAr,
          labelEn: f.labelEn,
          description: f.description || undefined,
          placeholder: f.placeholder || undefined,
          type: f.type,
          required: f.required,
          order: j,
          defaultValue: f.defaultValue || undefined,
          minValue: f.minValue ? Number(f.minValue) : null,
          maxValue: f.maxValue ? Number(f.maxValue) : null,
          minLength: f.minLength ? Number(f.minLength) : null,
          maxLength: f.maxLength ? Number(f.maxLength) : null,
          visibleIfFieldKey: f.visibleIfFieldKey || null,
          visibleIfValue: f.visibleIfValue || null,
          options: f.options.map((o, k) => ({ ...o, order: k })),
        })),
      })),
      tasks: tasks.map((task, i) => ({
        order: i,
        titleAr: task.titleAr,
        titleEn: task.titleEn,
        description: task.description || undefined,
        departmentId: task.departmentId || null,
        defaultPriority: task.defaultPriority,
        defaultEstimatedHours: task.defaultEstimatedHours ? Number(task.defaultEstimatedHours) : null,
        clientVisible: task.clientVisible,
        dependsOnOrder: task.dependsOnOrder,
      })),
    };
  }

  function saveDraft(onSuccess?: () => void) {
    startTransition(async () => {
      const result = await saveTemplateDraftAction(templateId, JSON.stringify(buildDraft()));
      if (result?.formError) {
        toast.error(t(`errors.${result.formError}` as "errors.invalidDraft"));
        return;
      }
      toast.success(t("toast.saved"));
      onSuccess?.();
    });
  }

  function publish() {
    saveDraft(() => {
      startTransition(async () => {
        const result = await publishTemplateAction(templateId);
        if (result?.formError) {
          toast.error(t(`errors.${result.formError}` as "errors.invalidDraft"));
          return;
        }
        toast.success(t("toast.published"));
      });
    });
  }

  const canSave =
    basicInfo.nameAr.trim() &&
    basicInfo.nameEn.trim() &&
    sections.length > 0 &&
    sections.every((s) => s.titleAr.trim() && s.titleEn.trim() && s.fields.every((f) => f.labelAr.trim() && f.labelEn.trim() && f.key.trim()));

  return (
    <div className="flex flex-col gap-6">
      {isPublished && <Badge variant="secondary">{t("editingDraftNotice")}</Badge>}

      <Card>
        <CardHeader>
          <CardTitle>{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t("fields.nameAr")}</Label>
            <Input value={basicInfo.nameAr} onChange={(e) => setBasicInfo((b) => ({ ...b, nameAr: e.target.value }))} dir="rtl" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.nameEn")}</Label>
            <Input value={basicInfo.nameEn} onChange={(e) => setBasicInfo((b) => ({ ...b, nameEn: e.target.value }))} dir="ltr" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>{t("fields.descriptionAr")}</Label>
            <Textarea
              value={basicInfo.descriptionAr ?? ""}
              onChange={(e) => setBasicInfo((b) => ({ ...b, descriptionAr: e.target.value }))}
              dir="rtl"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>{t("fields.descriptionEn")}</Label>
            <Textarea
              value={basicInfo.descriptionEn ?? ""}
              onChange={(e) => setBasicInfo((b) => ({ ...b, descriptionEn: e.target.value }))}
              dir="ltr"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.requestType")}</Label>
            <Select
              value={basicInfo.requestTypeId}
              onValueChange={(v) => setBasicInfo((b) => ({ ...b, requestTypeId: v ?? "" }))}
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
          <div className="flex flex-col gap-2">
            <Label>{t("fields.icon")}</Label>
            <Input
              value={basicInfo.icon ?? ""}
              onChange={(e) => setBasicInfo((b) => ({ ...b, icon: e.target.value }))}
              placeholder="🎨"
              maxLength={4}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.defaultPriority")}</Label>
            <Select
              value={basicInfo.defaultPriority}
              onValueChange={(v) => setBasicInfo((b) => ({ ...b, defaultPriority: (v as Priority) ?? "MEDIUM" }))}
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
            <Label>{t("fields.defaultDurationDays")}</Label>
            <Input
              type="number"
              min={0}
              value={basicInfo.defaultDurationDays ?? ""}
              onChange={(e) =>
                setBasicInfo((b) => ({
                  ...b,
                  defaultDurationDays: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections & Fields */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("sectionsTitle")}</h2>
          <Button type="button" size="sm" variant="outline" onClick={addSection}>
            <Plus className="size-4" />
            {t("addSection")}
          </Button>
        </div>
        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Input
                  value={section.titleAr}
                  onChange={(e) => updateSection(sectionIndex, { titleAr: e.target.value })}
                  placeholder={t("fields.sectionTitleAr")}
                  dir="rtl"
                />
                <Input
                  value={section.titleEn}
                  onChange={(e) => updateSection(sectionIndex, { titleEn: e.target.value })}
                  placeholder={t("fields.sectionTitleEn")}
                  dir="ltr"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveSection(sectionIndex, -1)}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveSection(sectionIndex, 1)}>
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeSection(sectionIndex)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {section.fields.map((field, fieldIndex) => (
                <div key={field.key} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={field.labelAr}
                        onChange={(e) => {
                          const patch: Partial<FieldRow> = { labelAr: e.target.value };
                          updateField(sectionIndex, fieldIndex, patch);
                        }}
                        placeholder={t("fields.labelAr")}
                        dir="rtl"
                      />
                      <Input
                        value={field.labelEn}
                        onChange={(e) => {
                          const patch: Partial<FieldRow> = { labelEn: e.target.value };
                          if (!field.key || field.key.startsWith("field_")) {
                            patch.key = slugify(e.target.value);
                          }
                          updateField(sectionIndex, fieldIndex, patch);
                        }}
                        placeholder={t("fields.labelEn")}
                        dir="ltr"
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveField(sectionIndex, fieldIndex, -1)}>
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveField(sectionIndex, fieldIndex, 1)}>
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeField(sectionIndex, fieldIndex)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">{t("fields.key")}</Label>
                      <Input
                        value={field.key}
                        onChange={(e) => updateField(sectionIndex, fieldIndex, { key: slugify(e.target.value) })}
                        dir="ltr"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">{t("fields.type")}</Label>
                      <Select
                        value={field.type}
                        onValueChange={(v) => updateField(sectionIndex, fieldIndex, { type: (v as TemplateFieldType) ?? "TEXT" })}
                        items={valuesToSelectItems(templateFieldTypeValues, tFieldType)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templateFieldTypeValues.map((value) => (
                            <SelectItem key={value} value={value}>
                              {tFieldType(value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(sectionIndex, fieldIndex, { required: Boolean(checked) })}
                      />
                      {t("fields.required")}
                    </label>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">{t("fields.placeholder")}</Label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) => updateField(sectionIndex, fieldIndex, { placeholder: e.target.value })}
                      />
                    </div>
                  </div>

                  {(field.type === "NUMBER" || field.type === "DECIMAL") && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t("fields.minValue")}</Label>
                        <Input
                          type="number"
                          value={field.minValue}
                          onChange={(e) => updateField(sectionIndex, fieldIndex, { minValue: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t("fields.maxValue")}</Label>
                        <Input
                          type="number"
                          value={field.maxValue}
                          onChange={(e) => updateField(sectionIndex, fieldIndex, { maxValue: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  {(field.type === "TEXT" || field.type === "TEXTAREA") && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t("fields.minLength")}</Label>
                        <Input
                          type="number"
                          value={field.minLength}
                          onChange={(e) => updateField(sectionIndex, fieldIndex, { minLength: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t("fields.maxLength")}</Label>
                        <Input
                          type="number"
                          value={field.maxLength}
                          onChange={(e) => updateField(sectionIndex, fieldIndex, { maxLength: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {(OPTION_BASED_FIELD_TYPES as readonly string[]).includes(field.type) && (
                    <div className="flex flex-col gap-2 border-t border-border pt-3">
                      <Label className="text-xs">{t("fields.options")}</Label>
                      {field.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <Input
                            value={option.labelAr}
                            onChange={(e) => updateOption(sectionIndex, fieldIndex, optionIndex, { labelAr: e.target.value })}
                            placeholder={t("fields.labelAr")}
                            dir="rtl"
                            className="flex-1"
                          />
                          <Input
                            value={option.labelEn}
                            onChange={(e) => {
                              // Only the English label auto-derives `value`
                              // (like the field key) — Arabic never does, so
                              // it can't produce a meaningless "field_N"
                              // fallback that then blocks the real slug.
                              const patch: Partial<FieldOptionRow> = { labelEn: e.target.value };
                              if (!option.value || option.value.startsWith("field_")) {
                                patch.value = slugify(e.target.value);
                              }
                              updateOption(sectionIndex, fieldIndex, optionIndex, patch);
                            }}
                            placeholder={t("fields.labelEn")}
                            dir="ltr"
                            className="flex-1"
                          />
                          <Input
                            value={option.value}
                            onChange={(e) => updateOption(sectionIndex, fieldIndex, optionIndex, { value: e.target.value })}
                            placeholder={t("fields.optionValue")}
                            dir="ltr"
                            className="w-28 shrink-0 font-mono text-xs"
                          />
                          <Checkbox
                            checked={option.isActive}
                            onCheckedChange={(checked) => updateOption(sectionIndex, fieldIndex, optionIndex, { isActive: Boolean(checked) })}
                          />
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeOption(sectionIndex, fieldIndex, optionIndex)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => addOption(sectionIndex, fieldIndex)}>
                        <Plus className="size-4" />
                        {t("addOption")}
                      </Button>
                    </div>
                  )}

                  <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">{t("fields.visibleIfField")}</Label>
                      <Select
                        value={field.visibleIfFieldKey}
                        onValueChange={(v) => updateField(sectionIndex, fieldIndex, { visibleIfFieldKey: v ?? "", visibleIfValue: "" })}
                        items={{ "": t("fields.noCondition"), ...Object.fromEntries(allFieldKeys.filter((k) => k !== field.key).map((k) => [k, k])) }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("fields.noCondition")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t("fields.noCondition")}</SelectItem>
                          {allFieldKeys
                            .filter((k) => k !== field.key)
                            .map((k) => (
                              <SelectItem key={k} value={k}>
                                {k}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {field.visibleIfFieldKey && (
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">{t("fields.visibleIfValue")}</Label>
                        {(() => {
                          const targetField = fieldByKey.get(field.visibleIfFieldKey);
                          const targetOptions = targetField?.options.filter((o) => o.value) ?? [];
                          if (targetOptions.length > 0) {
                            return (
                              <Select
                                value={field.visibleIfValue}
                                onValueChange={(v) => updateField(sectionIndex, fieldIndex, { visibleIfValue: v ?? "" })}
                                items={Object.fromEntries(targetOptions.map((o) => [o.value, o.labelEn || o.labelAr]))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {targetOptions.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                      {o.labelEn || o.labelAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          }
                          return (
                            <Input
                              value={field.visibleIfValue}
                              onChange={(e) => updateField(sectionIndex, fieldIndex, { visibleIfValue: e.target.value })}
                            />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => addField(sectionIndex)}>
                <Plus className="size-4" />
                {t("addField")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks & Dependencies */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("tasksTitle")}</h2>
          <Button type="button" size="sm" variant="outline" onClick={addTask}>
            <Plus className="size-4" />
            {t("addTaskRow")}
          </Button>
        </div>
        {tasks.map((task, index) => (
          <Card key={task.key}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-start gap-2">
                <span className="mt-2 shrink-0 text-xs text-muted-foreground">{index + 1}.</span>
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={task.titleAr}
                    onChange={(e) => updateTask(index, { titleAr: e.target.value })}
                    placeholder={t("fields.taskTitleAr")}
                    dir="rtl"
                  />
                  <Input
                    value={task.titleEn}
                    onChange={(e) => updateTask(index, { titleEn: e.target.value })}
                    placeholder={t("fields.taskTitleEn")}
                    dir="ltr"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveTask(index, -1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveTask(index, 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeTask(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Select
                  value={task.departmentId}
                  onValueChange={(v) => updateTask(index, { departmentId: v ?? "" })}
                  items={optionsToSelectItems(departments)}
                >
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
                <Select
                  value={task.defaultPriority}
                  onValueChange={(v) => updateTask(index, { defaultPriority: (v as Priority) ?? "MEDIUM" })}
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
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder={t("fields.estimatedHours")}
                  value={task.defaultEstimatedHours}
                  onChange={(e) => updateTask(index, { defaultEstimatedHours: e.target.value })}
                />
                <label className="flex items-center gap-2 self-center text-sm">
                  <Checkbox
                    checked={task.clientVisible}
                    onCheckedChange={(checked) => updateTask(index, { clientVisible: Boolean(checked) })}
                  />
                  {t("fields.clientVisible")}
                </label>
              </div>
              {tasks.length > 1 && (
                <div className="flex flex-col gap-1 border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">{t("fields.dependsOn")}</span>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={task.dependsOnOrder === null}
                        onCheckedChange={() => updateTask(index, { dependsOnOrder: null })}
                      />
                      {t("fields.noDependency")}
                    </label>
                    {tasks
                      .filter((_, i) => i !== index)
                      .map((other) => (
                        <label key={other.key} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={task.dependsOnOrder === other.order}
                            onCheckedChange={(checked) => updateTask(index, { dependsOnOrder: checked ? other.order : null })}
                          />
                          {other.titleEn || other.titleAr || "—"}
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isPending || !canSave} onClick={() => saveDraft()}>
          <Save className="size-4" />
          {tCommon("actions.save")}
        </Button>
        <Button type="button" disabled={isPending || !canSave} onClick={publish}>
          <Send className="size-4" />
          {t("publish")}
        </Button>
      </div>
    </div>
  );
}
