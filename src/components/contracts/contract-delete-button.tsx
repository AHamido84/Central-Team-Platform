"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteContractAction } from "@/lib/actions/contract-actions";

export function ContractDeleteButton({ contractId, clientId }: { contractId: string; clientId: string }) {
  const t = useTranslations("contracts.detail");

  return (
    <ConfirmDeleteDialog
      action={deleteContractAction.bind(null, contractId, clientId)}
      title={t("deleteContract")}
      description={t("deleteContractConfirm")}
      confirmLabel={t("deleteContract")}
      trigger={
        <Button variant="outline" size="sm">
          <Trash2 className="size-4" />
          {t("deleteContract")}
        </Button>
      }
    />
  );
}
