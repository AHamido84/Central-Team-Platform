import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/portal/empty-state";
import { ContactCard } from "@/components/clients/contact-card";
import { ContactDialog } from "@/components/clients/contact-dialog";
import { createContactAction } from "@/lib/actions/contact-actions";

export default async function ClientContactsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("contacts");

  const contacts = await prisma.clientContact.findMany({
    where: { clientId: id },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ContactDialog mode="create" action={createContactAction.bind(null, id)} />
      </div>
      {contacts.length === 0 ? (
        <EmptyState icon={Users} title={t("empty")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} clientId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
