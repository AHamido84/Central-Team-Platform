"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { sendForClientReviewAction } from "@/lib/actions/request-actions";

export function SendForReviewButton({ requestId }: { requestId: string }) {
  const t = useTranslations("requests");
  const tErrors = useTranslations("requests.errors");
  const tToast = useTranslations("requests.toast");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await sendForClientReviewAction(requestId);
          if (result?.formError === "tasksIncomplete") {
            toast.error(tErrors("tasksIncomplete"));
          } else if (!result?.formError) {
            toast.success(tToast("sentForReview"));
          }
        });
      }}
    >
      <Send className="size-4" />
      {t("detail.sendForReview")}
    </Button>
  );
}
