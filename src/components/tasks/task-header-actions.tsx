"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { archiveTaskAction, deleteTaskAction } from "@/lib/actions/task-actions";

export function TaskHeaderActions({
  taskId,
  isArchived,
}: {
  taskId: string;
  isArchived: boolean;
}) {
  const tCommon = useTranslations("common");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {!isArchived && (
        <form action={archiveTaskAction.bind(null, taskId)}>
          <Button type="submit" variant="outline" size="sm">
            <Archive className="size-4" />
            {tCommon("archive.confirmTitle")}
          </Button>
        </form>
      )}
      <ConfirmDeleteDialog
        action={async (prevState, formData) => {
          const result = await deleteTaskAction(taskId, prevState, formData);
          if (!result?.formError) {
            router.push("/tasks");
          }
          return result;
        }}
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
