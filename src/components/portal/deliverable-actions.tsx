"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import type { DeliverableActionState } from "@/lib/actions/deliverable-actions";

type BoundAction = (
  prevState: DeliverableActionState,
  formData: FormData,
) => Promise<DeliverableActionState>;

export function DeliverableActions({
  approveAction,
  requestChangesAction,
}: {
  approveAction: BoundAction;
  requestChangesAction: BoundAction;
}) {
  const t = useTranslations("deliverables");
  const [approveState, approveFormAction, isApproving] = useActionState<
    DeliverableActionState,
    FormData
  >(approveAction, undefined);
  const [open, setOpen] = useState(false);
  const [changesState, changesFormAction, isRequestingChanges] = useActionState<
    DeliverableActionState,
    FormData
  >(requestChangesAction, undefined);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !isRequestingChanges && !changesState?.formError) {
      setOpen(false);
    }
    wasPendingRef.current = isRequestingChanges;
  }, [isRequestingChanges, changesState]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={approveFormAction}>
        <Button type="submit" size="sm" disabled={isApproving}>
          <CheckCircle2 className="size-4" />
          {t("actions.approve")}
        </Button>
      </form>
      {approveState?.formError && (
        <span className="text-xs text-destructive">{approveState.formError}</span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button type="button" size="sm" variant="outline">
              <MessageSquareWarning className="size-4" />
              {t("actions.requestChanges")}
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("requestChangesDialog.title")}</DialogTitle>
          </DialogHeader>
          <form action={changesFormAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="comment">{t("requestChangesDialog.commentLabel")}</Label>
              <Textarea id="comment" name="comment" rows={4} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isRequestingChanges}>
                {t("requestChangesDialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
