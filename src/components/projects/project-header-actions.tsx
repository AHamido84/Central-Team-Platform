"use client";

import { useTranslations } from "next-intl";
import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { archiveProjectAction, deleteProjectAction } from "@/lib/actions/project-actions";

export function ProjectHeaderActions({
  projectId,
  clientId,
  isArchived,
}: {
  projectId: string;
  clientId: string;
  isArchived: boolean;
}) {
  const tCommon = useTranslations("common");

  return (
    <div className="flex items-center gap-2">
      {!isArchived && (
        <form action={archiveProjectAction.bind(null, projectId, clientId)}>
          <Button type="submit" variant="outline" size="sm">
            <Archive className="size-4" />
            {tCommon("archive.confirmTitle")}
          </Button>
        </form>
      )}
      <ConfirmDeleteDialog
        action={deleteProjectAction.bind(null, projectId, clientId)}
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
