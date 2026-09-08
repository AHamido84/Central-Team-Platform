"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Trash2, Plus } from "lucide-react";
import { priorityValues, scopeItemCategoryValues } from "@/lib/validations/project";
import { optionsToSelectItems, valuesToSelectItems } from "@/lib/select-items";
import { createRequestTemplateAction } from "@/lib/actions/request-template-actions";
import type { Priority } from "@prisma/client";

type Option = { id: string; label: string };

type Row = {
  key: string;
  title: string;
  description: string;
  departmentId: string;
  priority: Priority;
  estimatedHours: string;
  dependsOnKey: string;
};

let counter = 0;
function newRow(): Row {
  counter += 1;
  return {
    key: `row-${counter}`,
    title: "",
    description: "",
    departmentId: "",
    priority: "MEDIUM",
    estimatedHours: "",
    dependsOnKey: "",
  };
}

export function TemplateBuilder({ departments }: { departments: Option[] }) {
  const t = useTranslations("settings.templates");
  const tCategory = useTranslations("projects.scope.category");
  const tPriority = useTranslations("projects.priority");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [isPending, startTransition] = useTransition();

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) =>
      prev
        .filter((r) => r.key !== key)
        .map((r) => (r.dependsOnKey === key ? { ...r, dependsOnKey: "" } : r)),
    );
  }

  function submit() {
    const orderByKey = new Map(rows.map((r, i) => [r.key, i]));
    const items = rows.map((r, i) => ({
      order: i,
      title: r.title,
      description: r.description || undefined,
      departmentId: r.departmentId || undefined,
      defaultPriority: r.priority,
      defaultEstimatedHours: r.estimatedHours ? Number(r.estimatedHours) : undefined,
      dependsOnOrder: r.dependsOnKey ? orderByKey.get(r.dependsOnKey) : undefined,
    }));

    const formData = new FormData();
    formData.set("name", name);
    if (category) formData.set("category", category);
    formData.set("description", description);
    formData.set("itemsJson", JSON.stringify(items));

    startTransition(async () => {
      const result = await createRequestTemplateAction(undefined, formData);
      if (result?.formError) {
        toast.error(result.formError);
        return;
      }
      toast.success(t("title"));
      router.push("/settings");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("fields.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fields.category")}</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v ?? "")}
                items={{ "": t("noCategory"), ...valuesToSelectItems(scopeItemCategoryValues, tCategory) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("noCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noCategory")}</SelectItem>
                  {scopeItemCategoryValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tCategory(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("fields.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{t("items.title")}</h3>
        {rows.map((row, index) => (
          <Card key={row.key}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex items-start gap-2">
                <span className="mt-2 shrink-0 text-xs text-muted-foreground">{index + 1}.</span>
                <Input
                  className="flex-1"
                  value={row.title}
                  onChange={(e) => updateRow(row.key, { title: e.target.value })}
                  placeholder={t("items.titleLabel")}
                  required
                />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(row.key)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select
                  value={row.departmentId}
                  onValueChange={(v) => updateRow(row.key, { departmentId: v ?? "" })}
                  items={optionsToSelectItems(departments)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("items.department")} />
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
                  placeholder={t("items.estimatedHours")}
                  value={row.estimatedHours}
                  onChange={(e) => updateRow(row.key, { estimatedHours: e.target.value })}
                />
              </div>
              {rows.length > 1 && (
                <div className="flex flex-col gap-1 border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">{t("items.dependsOn")}</span>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={row.dependsOnKey === ""}
                        onCheckedChange={() => updateRow(row.key, { dependsOnKey: "" })}
                      />
                      {t("items.noDependency")}
                    </label>
                    {rows
                      .filter((r) => r.key !== row.key)
                      .map((other) => (
                        <label key={other.key} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={row.dependsOnKey === other.key}
                            onCheckedChange={(checked) =>
                              updateRow(row.key, { dependsOnKey: checked ? other.key : "" })
                            }
                          />
                          {other.title || "—"}
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={() => setRows((prev) => [...prev, newRow()])}>
          <Plus className="size-4" />
          {t("items.addRow")}
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={isPending || !name.trim() || rows.length === 0 || rows.some((r) => !r.title.trim())}
          onClick={submit}
        >
          {tCommon("actions.save")}
        </Button>
      </div>
    </div>
  );
}
