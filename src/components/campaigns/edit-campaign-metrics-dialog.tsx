"use client";

import { useActionState, useState } from "react";
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
import { Pencil } from "lucide-react";
import { updateCampaignMetricAction, type CampaignFormState } from "@/lib/actions/campaign-actions";

type MetricDefaults = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  conversions: number;
  revenue: number;
};

export function EditCampaignMetricsDialog({
  campaignId,
  projectId,
  defaultValues,
}: {
  campaignId: string;
  projectId: string;
  defaultValues?: MetricDefaults;
}) {
  const t = useTranslations("campaigns");
  const tMetrics = useTranslations("campaigns.metrics");
  const [open, setOpen] = useState(false);
  const action = updateCampaignMetricAction.bind(null, campaignId, projectId);
  const [, formAction, isPending] = useActionState<CampaignFormState, FormData>(action, undefined);

  const fields: { name: keyof MetricDefaults; label: string; step?: string }[] = [
    { name: "spend", label: tMetrics("spend"), step: "0.01" },
    { name: "impressions", label: tMetrics("impressions") },
    { name: "reach", label: tMetrics("reach") },
    { name: "clicks", label: tMetrics("clicks") },
    { name: "leads", label: tMetrics("leads") },
    { name: "conversions", label: tMetrics("conversions") },
    { name: "revenue", label: tMetrics("revenue"), step: "0.01" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            {t("editMetrics.title")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editMetrics.title")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-2">
                <Label>{field.label}</Label>
                <Input
                  name={field.name}
                  type="number"
                  min={0}
                  step={field.step ?? "1"}
                  defaultValue={defaultValues?.[field.name] ?? 0}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {t("editMetrics.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
