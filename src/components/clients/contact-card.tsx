"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { ContactDialog } from "@/components/clients/contact-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import {
  updateContactAction,
  deleteContactAction,
  setPrimaryContactAction,
  archiveContactAction,
} from "@/lib/actions/contact-actions";

type Contact = {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  preferredContactMethod: string | null;
  notes: string | null;
  status: string;
  isPrimary: boolean;
};

export function ContactCard({ contact, clientId }: { contact: Contact; clientId: string }) {
  const t = useTranslations("contacts");
  const tStatus = useTranslations("contacts.status");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{contact.name}</span>
            {contact.isPrimary && (
              <Badge variant="default">
                <Star className="size-3" />
                {t("primaryBadge")}
              </Badge>
            )}
            {contact.status === "ARCHIVED" && <Badge variant="secondary">{tStatus("ARCHIVED")}</Badge>}
          </div>
          {(contact.position || contact.department) && (
            <p className="text-sm text-muted-foreground">
              {[contact.position, contact.department].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ContactDialog
            mode="edit"
            action={updateContactAction.bind(null, contact.id, clientId)}
            defaultValues={{
              name: contact.name,
              position: contact.position ?? undefined,
              department: contact.department ?? undefined,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
              whatsapp: contact.whatsapp ?? undefined,
              preferredContactMethod: contact.preferredContactMethod ?? undefined,
              notes: contact.notes ?? undefined,
              isPrimary: contact.isPrimary,
            }}
          />
          <ConfirmDeleteDialog
            action={deleteContactAction.bind(null, contact.id, clientId)}
            title={t("deleteContact")}
            description={t("deleteContactConfirm")}
            confirmLabel={t("deleteContact")}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {contact.email && <span>{contact.email}</span>}
        {contact.phone && <span>{contact.phone}</span>}
        {contact.whatsapp && <span>{t("fields.whatsapp")}: {contact.whatsapp}</span>}
      </div>
      <div className="flex items-center gap-2">
        {!contact.isPrimary && (
          <form action={setPrimaryContactAction.bind(null, contact.id, clientId)}>
            <Button type="submit" variant="outline" size="sm">
              {t("setPrimary")}
            </Button>
          </form>
        )}
        {contact.status !== "ARCHIVED" && (
          <form action={archiveContactAction.bind(null, contact.id, clientId)}>
            <Button type="submit" variant="ghost" size="sm">
              {t("archiveContact")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
