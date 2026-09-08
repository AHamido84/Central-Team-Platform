"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { priorityValues } from "@/lib/validations/project";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";
import { generateTasksFromTemplateAction } from "@/lib/actions/request-template-actions";
import type { Priority } from "@prisma/client";

type Option = { id: string; label: string };

type TemplateItem = {
  order: number;
  title: string;
  description: string | null;
  departmentId: string | null;
  defaultPriority: Priority;
  defaultEstimatedHours: number | null;
  dependsOnOrder: number | null;
};

type Template = { id: string; name: string; items: TemplateItem[] };

type Row = {
  key: string;
  title: string;
  description: string;
  departmentId: string;
  assigneeId: string;
  priority: Priority;
  estimatedHours: string;
  startDate: string;
  dueDate: string;
  dependsOnKeys: string[];
};

let rowCounter = 0;
function newRow(): Row {
  rowCounter += 1;
  return {
    key: `row-${rowCounter}`,
    title: "",
    description: "",
    departmentId: "",
    assigneeId: "",
    priority: "MEDIUM",
    estimatedHours: "",
    startDate: "",
    dueDate: "",
    dependsOnKeys: [],
  };
}

function rowsFromTemplate(template: Template): Row[] {
  const keyForOrder = (order: number) => `tpl-${order}`;
  return template.items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      key: keyForOrder(item.order),
      title: item.title,
      description: item.description ?? "",
      departmentId: item.departmentId ?? "",
      assigneeId: "",
      priority: item.defaultPriority,
      estimatedHours: item.defaultEstimatedHours != null ? String(item.defaultEstimatedHours) : "",
      startDate: "",
      dueDate: "",
      dependsOnKeys: item.dependsOnOrder != null ? [keyForOrder(item.dependsOnOrder)] : [],
    }));
}

export function TaskGeneratorBuilder({
  requestId,
  templates,
  departments,
  assignees,
}: {
  requestId: string;
  templates: Template[];
  departments: Option[];
  assignees: Option[];
}) {
  const t = useTranslations("requests");
  const tPriority = useTranslations("projects.priority");
  const tCommon = useTranslations("common");
  const tTaskToast = useTranslations("tasks.toast");
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [isPending, startTransition] = useTransition();

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((tpl) => tpl.id === id);
    setRows(template ? rowsFromTemplate(template) : []);
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) =>
      prev
        .filter((r) => r.key !== key)
        .map((r) => ({ ...r, dependsOnKeys: r.dependsOnKeys.filter((k) => k !== key) })),
    );
  }

  function move(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function submit() {
    const drafts = rows.map((r) => ({
      key: r.key,
      title: r.title,
      description: r.description || undefined,
      departmentId: r.departmentId || undefined,
      assigneeId: r.assigneeId || undefined,
      priority: r.priority,
      estimatedHours: r.estimatedHours ? Number(r.estimatedHours) : undefined,
      startDate: r.startDate || undefined,
      dueDate: r.dueDate || undefined,
      dependsOnKeys: r.dependsOnKeys,
    }));
    startTransition(async () => {
      const result = await generateTasksFromTemplateAction(requestId, JSON.stringify(drafts));
      if (result?.formError) {
        toast.error(result.formError);
        return;
      }
      if (result?.warning) {
        toast.warning(tTaskToast("overloaded"));
      }
      router.push(`/requests/${requestId}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("template.pickerTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Select
            value={templateId}
            onValueChange={(v) => applyTemplate(v ?? "")}
            items={{
              "": t("template.skip"),
              ...optionsToSelectItems(templates.map((tpl) => ({ id: tpl.id, label: tpl.name }))),
            }}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={t("template.skip")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("template.skip")}</SelectItem>
              {templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("template.noneAvailable")}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <Card key={row.key}>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <Label>{t("fields.title")}</Label>
                  <Input
                    value={row.title}
                    onChange={(e) => updateRow(row.key, { title: e.target.value })}
                    required
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, -1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(row.key)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={row.description}
                onChange={(e) => updateRow(row.key, { description: e.target.value })}
                rows={2}
              />
              <div className="grid gap-3 sm:grid-cols-4">
                <Select
                  value={row.departmentId}
                  onValueChange={(v) => updateRow(row.key, { departmentId: v ?? "" })}
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
                  value={row.assigneeId}
                  onValueChange={(v) => updateRow(row.key, { assigneeId: v ?? "" })}
                  items={optionsToSelectItems(assignees)}
                >
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
                <Select
                  value={row.priority}
                  onValueChange={(v) => updateRow(row.key, { priority: (v as Priority) ?? "MEDIUM" })}
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
                  value={row.estimatedHours}
                  onChange={(e) => updateRow(row.key, { estimatedHours: e.target.value })}
                />
                <Input
                  type="date"
                  value={row.startDate}
                  onChange={(e) => updateRow(row.key, { startDate: e.target.value })}
                />
                <Input
                  type="date"
                  value={row.dueDate}
                  onChange={(e) => updateRow(row.key, { dueDate: e.target.value })}
                />
              </div>
              {rows.length > 1 && (
                <div className="flex flex-wrap gap-3 border-t border-border pt-3">
                  {rows
                    .filter((r) => r.key !== row.key)
                    .map((other) => (
                      <label key={other.key} className="flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={row.dependsOnKeys.includes(other.key)}
                          onCheckedChange={(checked) =>
                            updateRow(row.key, {
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

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => setRows((prev) => [...prev, newRow()])}>
          <Plus className="size-4" />
          {tCommon("actions.add")}
        </Button>
        <Button
          type="button"
          disabled={isPending || rows.length === 0 || rows.some((r) => !r.title.trim())}
          onClick={submit}
        >
          {tCommon("actions.submit")}
        </Button>
      </div>
    </div>
  );
}
