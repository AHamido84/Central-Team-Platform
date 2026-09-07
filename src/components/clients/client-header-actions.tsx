"use client";

import { useTranslations } from "next-intl";
import { Pencil, Archive, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { archiveClientAction, deleteClientAction } from "@/lib/actions/client-actions";

export function ClientHeaderActions({ clientId, isArchived }: { clientId: string; isArchived: boolean }) {
  const t = useTranslations("clients.detail");
  const tCommon = useTranslations("common");

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        render={
          <Link href={`/clients/${clientId}/edit`}>
            <Pencil className="size-4" />
            {tCommon("actions.edit")}
          </Link>
        }
      />
      {!isArchived && (
        <form action={archiveClientAction.bind(null, clientId)}>
          <Button type="submit" variant="outline" size="sm">
            <Archive className="size-4" />
            {t("archiveClient")}
          </Button>
        </form>
      )}
      <ConfirmDeleteDialog
        action={deleteClientAction.bind(null, clientId)}
        title={t("deleteClient")}
        description={t("deleteClientConfirm")}
        confirmLabel={t("deleteClient")}
        trigger={
          <Button variant="outline" size="sm">
            <Trash2 className="size-4" />
            {t("deleteClient")}
          </Button>
        }
      />
    </div>
  );
}
