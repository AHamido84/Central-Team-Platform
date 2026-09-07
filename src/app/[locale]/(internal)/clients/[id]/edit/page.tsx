import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { updateClientAction } from "@/lib/actions/client-actions";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const t = await getTranslations("clients");
  const tCommon = await getTranslations("common");

  const [client, internalUsers] = await Promise.all([
    prisma.client.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { clientId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!client) notFound();

  const updateAction = updateClientAction.bind(null, client.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("editTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={updateAction}
            submitLabel={tCommon("actions.saveChanges")}
            internalUsers={internalUsers.map((u) => ({ id: u.id, label: u.name }))}
            defaultValues={{
              companyName: client.companyName,
              legalName: client.legalName ?? undefined,
              commercialRegistration: client.commercialRegistration ?? undefined,
              taxNumber: client.taxNumber ?? undefined,
              industry: client.industry ?? undefined,
              website: client.website ?? undefined,
              email: client.email ?? undefined,
              phone: client.phone ?? undefined,
              address: client.address ?? undefined,
              country: client.country ?? undefined,
              city: client.city ?? undefined,
              accountManagerId: client.accountManagerId ?? undefined,
              status: client.status,
              notes: client.notes ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
