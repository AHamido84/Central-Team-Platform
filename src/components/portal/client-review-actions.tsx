"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToClientReviewAction } from "@/lib/actions/request-actions";

export function ClientReviewActions({ requestId }: { requestId: string }) {
  const t = useTranslations("requests.clientReview");
  const tToast = useTranslations("requests.toast");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(decision: "APPROVE" | "REQUEST_CHANGES") {
    setError(null);
    startTransition(async () => {
      const result = await respondToClientReviewAction(requestId, decision, comment);
      if (result?.formError === "commentRequired") {
        setError(t("commentRequired"));
        return;
      }
      if (!result?.formError) {
        toast.success(decision === "APPROVE" ? tToast("approved") : tToast("changesRequested"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
          rows={3}
        />
        {error && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => submit("REQUEST_CHANGES")}
          >
            {t("requestChanges")}
          </Button>
          <Button type="button" disabled={isPending} onClick={() => submit("APPROVE")}>
            {t("approve")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
