import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractForm } from "@/components/contracts/contract-form";
import { createContractAction } from "@/lib/actions/contract-actions";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await requireUser();
  const { clientId } = await searchParams;
  const t = await getTranslations("contracts");
  const tCommon = await getTranslations("common");

  const clients = await prisma.client.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("createTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm
            action={createContractAction}
            submitLabel={tCommon("actions.create")}
            clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
            defaultValues={clientId ? { clientId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
