"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { Trash2 } from "lucide-react";

export type DeleteActionState = { formError?: string } | undefined;

/**
 * Shared confirmation dialog for every destructive delete in the app (spec
 * §17: "before deletion, check dependencies... show a warning"). The bound
 * server action is expected to return `{ formError: "hasDependencies" }`
 * when the record has related data instead of deleting it — this dialog
 * renders that as the exact warning the spec asks for, rather than a
 * generic error. A successful delete that redirects (most of them) just
 * navigates away; one that doesn't closes the dialog automatically.
 */
export function ConfirmDeleteDialog({
  action,
  title,
  description,
  trigger,
  confirmLabel,
}: {
  action: (prevState: DeleteActionState, formData: FormData) => Promise<DeleteActionState>;
  title: string;
  description: string;
  trigger?: React.ReactElement;
  confirmLabel: string;
}) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<DeleteActionState, FormData>(
    action,
    undefined,
  );
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !isPending && !state?.formError) {
      setOpen(false);
    }
    wasPendingRef.current = isPending;
  }, [isPending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="destructive" size="icon-sm" aria-label={confirmLabel}>
              <Trash2 className="size-4" />
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        {state?.formError && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {state.formError === "hasDependencies"
              ? tCommon("confirmDialog.hasDependencies")
              : state.formError}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {tCommon("actions.cancel")}
          </Button>
          <form action={formAction}>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {confirmLabel}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
