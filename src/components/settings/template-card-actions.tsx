"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import {
  archiveTemplateAction,
  restoreTemplateAction,
  duplicateTemplateAction,
  deleteTemplateAction,
} from "@/lib/actions/request-template-actions";
import { Pencil, Eye, Copy, Archive, ArchiveRestore, Trash2 } from "lucide-react";

export function TemplateCardActions({
  templateId,
  isArchived,
}: {
  templateId: string;
  isArchived: boolean;
}) {
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-border pt-3">
      <Button size="sm" variant="ghost" render={<Link href={`/settings/request-templates/${templateId}`}><Pencil className="size-4" />{tCommon("actions.edit")}</Link>} />
      <Button size="sm" variant="ghost" render={<Link href={`/settings/request-templates/${templateId}/preview`}><Eye className="size-4" />{tCommon("actions.view")}</Link>} />
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={tCommon("actions.duplicate")}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await duplicateTemplateAction(templateId);
            if (result?.formError) toast.error(result.formError);
          });
        }}
      >
        <Copy className="size-4" />
      </Button>
      {isArchived ? (
        <form action={restoreTemplateAction.bind(null, templateId)}>
          <Button type="submit" size="icon-sm" variant="ghost" aria-label={tCommon("actions.restore")}>
            <ArchiveRestore className="size-4" />
          </Button>
        </form>
      ) : (
        <form action={archiveTemplateAction.bind(null, templateId)}>
          <Button type="submit" size="icon-sm" variant="ghost" aria-label={tCommon("archive.confirmTitle")}>
            <Archive className="size-4" />
          </Button>
        </form>
      )}
      <ConfirmDeleteDialog
        action={deleteTemplateAction.bind(null, templateId)}
        title={tCommon("actions.confirmDelete")}
        description={tCommon("confirmDialog.deleteDescription")}
        confirmLabel={tCommon("actions.delete")}
        trigger={
          <Button size="icon-sm" variant="ghost" aria-label={tCommon("actions.delete")}>
            <Trash2 className="size-4" />
          </Button>
        }
      />
    </div>
  );
}
