"use client";

import { useTranslations } from "next-intl";
import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { archiveRequestAction, deleteRequestAction } from "@/lib/actions/request-actions";

export function RequestHeaderActions({
  requestId,
  isArchived,
}: {
  requestId: string;
  isArchived: boolean;
}) {
  const tCommon = useTranslations("common");

  return (
    <div className="flex items-center gap-2">
      {!isArchived && (
        <form action={archiveRequestAction.bind(null, requestId)}>
          <Button type="submit" variant="outline" size="sm">
            <Archive className="size-4" />
            {tCommon("archive.confirmTitle")}
          </Button>
        </form>
      )}
      <ConfirmDeleteDialog
        action={deleteRequestAction.bind(null, requestId)}
        title={tCommon("actions.confirmDelete")}
        description={tCommon("confirmDialog.deleteDescription")}
        confirmLabel={tCommon("actions.delete")}
        trigger={
          <Button variant="outline" size="sm">
            <Trash2 className="size-4" />
            {tCommon("actions.delete")}
          </Button>
        }
      />
    </div>
  );
}
