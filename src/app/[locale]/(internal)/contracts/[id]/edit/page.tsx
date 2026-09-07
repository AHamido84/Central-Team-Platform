import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractForm } from "@/components/contracts/contract-form";
import { updateContractAction } from "@/lib/actions/contract-actions";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

function toDateInputValue(date: Date | null) {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const t = await getTranslations("contracts");
  const tCommon = await getTranslations("common");

  const [contract, clients] = await Promise.all([
    prisma.contract.findUnique({ where: { id } }),
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
  ]);
  if (!contract) notFound();

  const updateAction = updateContractAction.bind(null, contract.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("editTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm
            action={updateAction}
            submitLabel={tCommon("actions.saveChanges")}
            clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
            defaultValues={{
              clientId: contract.clientId,
              title: contract.title,
              contractNumber: contract.contractNumber ?? undefined,
              type: contract.type ?? undefined,
              startDate: toDateInputValue(contract.startDate),
              endDate: toDateInputValue(contract.endDate),
              value: contract.value ? contract.value.toString() : undefined,
              currency: contract.currency ?? undefined,
              paymentTerms: contract.paymentTerms ?? undefined,
              status: contract.status,
              fileUrl: contract.fileUrl ?? undefined,
              notes: contract.notes ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
