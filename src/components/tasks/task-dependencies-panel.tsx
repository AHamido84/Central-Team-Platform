"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { addTaskDependencyAction, removeTaskDependencyAction } from "@/lib/actions/task-actions";
import { optionsToSelectItems } from "@/lib/select-items";

type DependencyRow = { id: string; title: string; status: string; met: boolean };
type Candidate = { id: string; title: string };

export function TaskDependenciesPanel({
  taskId,
  dependencies,
  candidates,
}: {
  taskId: string;
  dependencies: DependencyRow[];
  candidates: Candidate[];
}) {
  const t = useTranslations("tasks");
  const tStatus = useTranslations("tasks.status");
  const tToast = useTranslations("tasks.toast");
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");

  const available = candidates.filter((c) => !dependencies.some((d) => d.id === c.id));

  return (
    <div className="flex flex-col gap-3">
      {dependencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dependencies.none")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dependencies.map((dep) => (
            <li key={dep.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span>{dep.title}</span>
                <Badge variant={dep.met ? "secondary" : "destructive"}>{tStatus(dep.status)}</Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                aria-label={t("dependencies.remove")}
                onClick={() => {
                  startTransition(async () => {
                    await removeTaskDependencyAction(taskId, dep.id);
                  });
                }}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value={selected}
            onValueChange={(v) => setSelected(v ?? "")}
            items={optionsToSelectItems(available.map((c) => ({ id: c.id, label: c.title })))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("dependencies.selectTask")} />
            </SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            disabled={!selected || isPending}
            onClick={() => {
              const dependsOnTaskId = selected;
              startTransition(async () => {
                const result = await addTaskDependencyAction(taskId, dependsOnTaskId);
                if (result?.formError === "cycleDetected") {
                  toast.error(tToast("cycleDetected"));
                } else {
                  setSelected("");
                }
              });
            }}
          >
            {t("dependencies.add")}
          </Button>
        </div>
      )}
    </div>
  );
}
