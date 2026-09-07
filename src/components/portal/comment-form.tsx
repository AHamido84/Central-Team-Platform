"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CommentFormState } from "@/lib/actions/comment-actions";

type BoundAction = (prevState: CommentFormState, formData: FormData) => Promise<CommentFormState>;

export function CommentForm({
  action,
  entityType,
  entityId,
}: {
  action: BoundAction;
  entityType: string;
  entityId: string;
}) {
  const t = useTranslations("activity.comments");
  const [state, formAction, isPending] = useActionState<CommentFormState, FormData>(
    action,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !isPending && !state?.formError && !state?.errors) {
      formRef.current?.reset();
    }
    wasPendingRef.current = isPending;
  }, [isPending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <Textarea name="body" rows={3} placeholder={t("placeholder")} required />
      {state?.errors?.body && (
        <p className="text-xs font-medium text-destructive">{state.errors.body}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
