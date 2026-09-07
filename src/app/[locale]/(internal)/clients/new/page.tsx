import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { createClientAction } from "@/lib/actions/client-actions";
import { requireUser } from "@/lib/authorization";

export default async function NewClientPage() {
  await requireUser();
  const t = await getTranslations("clients");
  const tCommon = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("createTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="sr-only">{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm action={createClientAction} submitLabel={tCommon("actions.create")} />
        </CardContent>
      </Card>
    </div>
  );
}
